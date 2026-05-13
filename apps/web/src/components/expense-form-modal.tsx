'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { env } from '@/lib/env';
import { ocrReceipt, type OcrResult } from '@/lib/ocr';
import { Avatar, Chip, Label } from './atoms';
import { Sheet } from './sheet';
import { CatIcon, IcCamera, IcCheck, IcEdit, IcReceipt, IcSparkle } from './icons';

const CATEGORIES = [
  { value: 'TRANSPORT', label: 'Transport', icon: 'car' as const },
  { value: 'RESTAURANT', label: 'Resto', icon: 'fork' as const },
  { value: 'LODGING', label: 'Logement', icon: 'bed' as const },
  { value: 'ACTIVITY', label: 'Activité', icon: 'ticket' as const },
  { value: 'OTHER', label: 'Autre', icon: 'receipt' as const },
] as const;

const SPLIT_METHODS = [
  { value: 'EQUAL', label: 'Égal' },
  { value: 'SHARES', label: 'Parts' },
  { value: 'EXACT', label: 'Exact' },
] as const;

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD'];

interface Member {
  id: string;
  name: string;
}

export interface ExpenseEditData {
  id: string;
  label: string;
  category: (typeof CATEGORIES)[number]['value'];
  amount: number;
  currency: string;
  amountOriginal: number | null;
  currencyOriginal: string | null;
  date: string | Date;
  splitMethod: (typeof SPLIT_METHODS)[number]['value'];
  payer: { id: string };
  shares: { userId: string; amount: number }[];
}

interface Props {
  tripId: string;
  tripCurrency: string;
  defaultSplitMethod?: (typeof SPLIT_METHODS)[number]['value'];
  members: Member[];
  currentUserId: string;
  expense?: ExpenseEditData;
  canDelete?: boolean;
  onClose: () => void;
  onCreated: () => void;
  onDeleted?: () => void;
}

export function ExpenseFormModal({
  tripId,
  tripCurrency,
  defaultSplitMethod = 'EQUAL',
  members,
  currentUserId,
  expense,
  canDelete,
  onClose,
  onCreated,
  onDeleted,
}: Props) {
  const isEdit = expense !== undefined;
  const initAmount = expense
    ? (expense.amountOriginal ?? expense.amount).toString().replace('.', ',')
    : '';
  const initCurrency = expense ? expense.currencyOriginal ?? expense.currency : tripCurrency;
  const initDate = expense
    ? new Date(expense.date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const initSelected = expense
    ? new Set(expense.shares.map((s) => s.userId))
    : new Set(members.map((m) => m.id));
  const initValues: Record<string, string> = {};
  if (expense) {
    for (const s of expense.shares) initValues[s.userId] = s.amount.toString().replace('.', ',');
  }

  const [amount, setAmount] = useState(initAmount);
  const [currency, setCurrency] = useState(initCurrency);
  const [label, setLabel] = useState(expense?.label ?? '');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>(expense?.category ?? 'OTHER');
  const [date, setDate] = useState(initDate);
  const [payerId, setPayerId] = useState(expense?.payer.id ?? currentUserId);
  const [splitMethod, setSplitMethod] = useState<(typeof SPLIT_METHODS)[number]['value']>(
    expense?.splitMethod ?? defaultSplitMethod,
  );
  const [selected, setSelected] = useState<Set<string>>(initSelected);
  const [values, setValues] = useState<Record<string, string>>(initValues);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedDocs, setLinkedDocs] = useState<{ id: string; filename: string }[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<(OcrResult & { file: File }) | null>(null);
  const [pendingReceipt, setPendingReceipt] = useState<File | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!expense) return;
    let cancelled = false;
    apiFetch<{ id: string; filename: string }[]>(
      `/trips/${tripId}/documents?expenseId=${expense.id}`,
    )
      .then((d) => {
        if (!cancelled) setLinkedDocs(d);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [expense, tripId]);

  const amountNum = parseFloat(amount.replace(',', '.')) || 0;
  const perEqual = selected.size > 0 ? Math.round((amountNum / selected.size) * 100) / 100 : 0;

  const onlyPayerSelected = selected.size === 1 && selected.has(payerId);
  const exactSum = splitMethod === 'EXACT'
    ? Array.from(selected).reduce((acc, id) => acc + (Number(values[id] ?? 0) || 0), 0)
    : 0;
  const exactMismatch = splitMethod === 'EXACT' && amountNum > 0 && Math.abs(exactSum - amountNum) > 0.01;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!amountNum || !label || selected.size === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const participants = Array.from(selected).map((id) => ({
        userId: id,
        value: splitMethod === 'EQUAL' ? undefined : Number((values[id] ?? '0').replace(',', '.')),
      }));
      const body = JSON.stringify({
        label,
        amount: amountNum,
        currency,
        category,
        date: new Date(date).toISOString(),
        payerId,
        splitMethod,
        participants,
      });
      if (isEdit && expense) {
        await apiFetch(`/trips/${tripId}/expenses/${expense.id}`, { method: 'PATCH', body });
      } else {
        const created = await apiFetch<{ id: string }>(`/trips/${tripId}/expenses`, {
          method: 'POST',
          body,
        });
        if (pendingReceipt && created?.id) {
          try {
            await uploadReceiptDocument(created.id, pendingReceipt);
          } catch {
            // Non-blocking : the expense is created, the receipt upload failed silently
          }
        }
      }
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setSubmitting(false);
    }
  };

  const handleScan = async (file: File) => {
    if (scanning) return;
    setScanning(true);
    setError(null);
    try {
      const result = await ocrReceipt(file);
      setScanResult({ ...result, file });
    } catch (e) {
      setError(e instanceof Error ? `OCR : ${e.message}` : 'Erreur lecture du ticket');
    } finally {
      setScanning(false);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
    }
  };

  const applyScanResult = () => {
    if (!scanResult) return;
    if (scanResult.amount !== null) {
      setAmount(scanResult.amount.toString().replace('.', ','));
    }
    if (scanResult.currency) {
      setCurrency(scanResult.currency);
    }
    if (scanResult.date) {
      setDate(scanResult.date);
    }
    setPendingReceipt(scanResult.file);
    setScanResult(null);
  };

  const uploadReceiptDocument = async (expenseId: string, file: File) => {
    const session = await getSession();
    if (!session?.accessToken) return;
    const form = new FormData();
    form.append('file', file);
    form.append('linkedExpenseId', expenseId);
    await fetch(`${env.apiUrl}/api/trips/${tripId}/documents`, {
      method: 'POST',
      headers: { authorization: `Bearer ${session.accessToken}` },
      body: form,
    });
  };

  const remove = async () => {
    if (!isEdit || !expense || deleting) return;
    if (!window.confirm('Supprimer cette dépense ? Cette action est irréversible.')) return;
    setError(null);
    setDeleting(true);
    try {
      await apiFetch(`/trips/${tripId}/expenses/${expense.id}`, { method: 'DELETE' });
      if (onDeleted) onDeleted();
      else onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setDeleting(false);
    }
  };

  return (
    <Sheet
      onClose={onClose}
      title={isEdit ? 'Modifier dépense' : 'Nouvelle dépense'}
      action={
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !amountNum || !label || selected.size === 0 || exactMismatch}
          className="rounded-[9px] bg-ink px-3 py-[7px] text-[12px] font-bold text-white disabled:opacity-40"
        >
          {submitting ? '…' : isEdit ? 'Enregistrer' : 'Ajouter'}
        </button>
      }
    >
      <div className="px-4 pb-6 pt-2.5">
        {!isEdit ? (
          <div className="mb-3 flex items-center gap-2 rounded-input border border-line2 bg-bg px-3 py-2.5">
            <IcCamera size={16} sw={1.8} className="text-ink-2" />
            <div className="flex-1 text-[12.5px] text-ink-2">
              {pendingReceipt ? (
                <span>
                  Ticket scanné <span className="text-ink-3">· {pendingReceipt.name}</span>
                </span>
              ) : (
                <span>Pré-remplir depuis un ticket de caisse</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => receiptInputRef.current?.click()}
              disabled={scanning}
              className="rounded-pill bg-ink px-2.5 py-1 text-[11.5px] font-semibold text-white disabled:opacity-50"
            >
              {scanning ? 'Analyse…' : pendingReceipt ? 'Re-scanner' : 'Scanner'}
            </button>
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleScan(f);
              }}
            />
          </div>
        ) : null}

        {/* Amount big */}
        <div className="flex flex-col items-center gap-1.5 border-b border-line py-6">
          <div className="label-up-bold">Montant</div>
          <div className="flex items-baseline gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="0,00"
              className="mono w-[160px] border-none bg-transparent text-center text-[54px] font-semibold tracking-[-0.04em] tabular-nums text-ink outline-none placeholder:text-ink-3/40"
            />
            <span className="mono text-[24px] font-medium text-ink-3">
              {currencySymbol(currency)}
            </span>
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {CURRENCIES.slice(0, 4).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={
                  currency === c
                    ? 'rounded-pill bg-ink px-2 py-[3px] text-[11px] font-semibold text-white'
                    : 'rounded-pill border border-line2 px-2 py-[3px] text-[11px] font-semibold text-ink-3'
                }
              >
                {c}
              </button>
            ))}
          </div>
          {currency !== tripCurrency ? (
            <p className="mt-2 text-[11px] text-ink-3">
              Conversion auto vers {tripCurrency} au taux du jour
            </p>
          ) : null}
        </div>

        {/* Description */}
        <div className="pt-4">
          <Label>Description</Label>
          <div className="flex items-center gap-2.5 rounded-input bg-bg px-3.5 py-3">
            <IcEdit size={16} sw={1.8} className="text-ink-3" />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex. Dîner Bairro Alto"
              className="flex-1 border-none bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-ink-3"
            />
            <Chip tone="accent" size="sm">
              <IcSparkle size={11} sw={1.8} /> Auto
            </Chip>
          </div>
        </div>

        {/* Category */}
        <div className="pt-4">
          <Label>Catégorie</Label>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {CATEGORIES.map((c) => {
              const active = c.value === category;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-btn px-3 py-[9px] text-[12.5px] font-semibold ${
                    active ? 'bg-ink text-white' : 'bg-bg text-ink-2'
                  }`}
                >
                  <CatIcon name={c.icon} size={15} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div className="pt-4">
          <Label>Date</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-input bg-bg px-3.5 py-3 text-[14px] font-semibold text-ink outline-none"
          />
        </div>

        {/* Payer */}
        <div className="pt-4">
          <Label>Payé par</Label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const active = m.id === payerId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayerId(m.id)}
                  className={`inline-flex items-center gap-2 rounded-pill p-[6px_12px_6px_6px] text-[12.5px] font-semibold ${
                    active ? 'bg-ink text-white' : 'bg-bg text-ink-2'
                  }`}
                >
                  <Avatar id={m.id} name={m.name} size={26} />
                  {m.id === currentUserId ? 'Toi' : m.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split */}
        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between">
            <Label noMargin>Partager entre · {selected.size}/{members.length}</Label>
            <div className="flex gap-1 rounded-[10px] bg-bg p-[3px]">
              {SPLIT_METHODS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSplitMethod(s.value)}
                  className={`rounded-[8px] px-2.5 py-1 text-[11px] font-semibold ${
                    splitMethod === s.value
                      ? 'bg-surface text-ink shadow-card'
                      : 'text-ink-3'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-2 flex items-center gap-1.5 rounded-[10px] bg-accent/30 px-3 py-2 text-[11.5px] text-accent-ink">
            <span>💡</span>
            <span>Coche <b>tous ceux à qui partager</b> la dépense (le payeur inclus s'il en profite aussi).</span>
          </div>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set(members.map((m) => m.id)))}
              className="rounded-pill bg-bg px-3 py-1 text-[11px] font-semibold text-ink-2"
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-pill bg-bg px-3 py-1 text-[11px] font-semibold text-ink-2"
            >
              Aucun
            </button>
          </div>
          {onlyPayerSelected && members.length > 1 ? (
            <div className="mb-2 flex items-center gap-1.5 rounded-[10px] bg-neg/10 px-3 py-2 text-[11.5px] text-neg">
              <span>⚠️</span>
              <span>
                Tu n'as coché que le payeur : c'est une <b>note perso</b>, aucune dette ne sera générée.
              </span>
            </div>
          ) : null}
          {exactMismatch ? (
            <div className="mb-2 flex items-center gap-1.5 rounded-[10px] bg-neg/10 px-3 py-2 text-[11.5px] text-neg">
              <span>⚠️</span>
              <span>
                La somme des montants exacts ({exactSum.toFixed(2).replace('.', ',')}{currencySymbol(currency)}) doit égaler {amountNum.toFixed(2).replace('.', ',')}{currencySymbol(currency)}.
              </span>
            </div>
          ) : null}
          <div className="overflow-hidden rounded-input bg-bg">
            {members.map((m, i) => {
              const checked = selected.has(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  className={`flex cursor-pointer items-center gap-3 px-3.5 py-[11px] ${
                    i < members.length - 1 ? 'border-b border-line' : ''
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[6px] border-[1.5px] ${
                      checked ? 'border-ink bg-ink' : 'border-line2 bg-transparent'
                    }`}
                  >
                    {checked ? <IcCheck size={13} sw={2.5} className="text-white" /> : null}
                  </div>
                  <Avatar id={m.id} name={m.name} size={26} />
                  <div
                    className={`flex-1 text-[13px] font-semibold ${
                      checked ? 'text-ink' : 'text-ink-3'
                    }`}
                  >
                    {m.id === currentUserId ? 'Toi' : m.name}
                  </div>
                  {splitMethod === 'EQUAL' ? (
                    <span
                      className={`mono text-[12.5px] font-semibold ${
                        checked ? 'text-ink-2' : 'text-mute'
                      }`}
                    >
                      {checked ? perEqual.toFixed(2).replace('.', ',') : '0,00'}
                      {currencySymbol(currency)}
                    </span>
                  ) : checked ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={splitMethod === 'EXACT' ? '€' : 'parts'}
                      value={values[m.id] ?? ''}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [m.id]: e.target.value }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 rounded-pill border border-line2 bg-surface px-2 py-1 text-right text-[12px] mono"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {error ? <p className="pt-3 text-[13px] text-neg">{error}</p> : null}

        {isEdit ? (
          <div className="pt-4">
            <div className="flex items-center justify-between">
              <Label noMargin>Documents joints · {linkedDocs.length}</Label>
              <Link
                href={`/trips/${tripId}/documents`}
                className="text-[11.5px] font-semibold text-ink-3"
              >
                Gérer →
              </Link>
            </div>
            {linkedDocs.length === 0 ? (
              <p className="mt-1 text-[12px] text-ink-3">
                Aucun document lié. Va dans <strong>Documents</strong> pour joindre une facture.
              </p>
            ) : (
              <div className="mt-2 flex flex-col gap-1.5">
                {linkedDocs.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 rounded-input bg-bg px-3 py-2"
                  >
                    <IcReceipt size={14} sw={1.8} className="text-ink-3" />
                    <span className="flex-1 truncate text-[12.5px] font-medium text-ink">
                      {d.filename}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {isEdit && canDelete ? (
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="mt-5 inline-flex w-full items-center justify-center rounded-input border border-line2 bg-surface px-5 py-3 text-[13px] font-bold text-neg disabled:opacity-50"
          >
            {deleting ? 'Suppression…' : 'Supprimer cette dépense'}
          </button>
        ) : null}
      </div>

      {scanResult ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-6">
          <div className="w-full max-w-sm rounded-card-lg bg-surface p-5 shadow-card-lg">
            <div className="mb-1 text-[14px] font-bold text-ink">Résultats détectés</div>
            <p className="mb-4 text-[12px] text-ink-3">
              Vérifie les valeurs avant d'appliquer. Tu pourras toujours les corriger ensuite.
            </p>
            <div className="space-y-2">
              <ScanRow label="Montant" value={scanResult.amount !== null ? `${scanResult.amount.toFixed(2).replace('.', ',')} ${currencySymbol(scanResult.currency ?? currency)}` : 'Non détecté'} found={scanResult.amount !== null} />
              <ScanRow label="Devise" value={scanResult.currency ?? 'Non détectée'} found={!!scanResult.currency} />
              <ScanRow label="Date" value={scanResult.date ?? 'Non détectée'} found={!!scanResult.date} />
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setScanResult(null)}
                className="flex-1 rounded-input border border-line2 bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-2"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={applyScanResult}
                className="flex-1 rounded-input bg-ink px-4 py-2.5 text-[13px] font-bold text-white"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}

function ScanRow({ label, value, found }: { label: string; value: string; found: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-input bg-bg px-3 py-2">
      <span className="text-[12px] font-semibold text-ink-3">{label}</span>
      <span className={`text-[13px] font-bold ${found ? 'text-ink' : 'text-ink-3'}`}>
        {value}
      </span>
    </div>
  );
}

function currencySymbol(code: string): string {
  return code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code;
}
