'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Avatar, Card, Chip, Label } from '@/components/atoms';
import { IcArrowL, IcArrowR } from '@/components/icons';
import { InviteButton } from '@/components/invite-button';
import { Sheet } from '@/components/sheet';
import { LoadingFallback, Skeleton, SkeletonCircle } from '@/components/skeleton';
import { env } from '@/lib/env';

type SplitMethod = 'EQUAL' | 'SHARES' | 'EXACT';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

type TripAmbiance = 'CITY_BREAK' | 'MOUNTAIN' | 'BEACH' | 'ROAD_TRIP';

interface TripDetail {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  ambiance: TripAmbiance | null;
  currency: string;
  budget: number | null;
  defaultSplitMethod: SplitMethod;
  hasCover: boolean;
  members: Member[];
}

const AMBIANCE_LABELS: Record<TripAmbiance, string> = {
  CITY_BREAK: 'City break',
  MOUNTAIN: 'Montagne',
  BEACH: 'Plage',
  ROAD_TRIP: 'Road trip',
};

const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollar US' },
  { code: 'GBP', symbol: '£', label: 'Livre Sterling' },
  { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse' },
  { code: 'JPY', symbol: '¥', label: 'Yen' },
  { code: 'CAD', symbol: 'CA$', label: 'Dollar Canadien' },
];

const SPLIT_LABELS: Record<SplitMethod, string> = {
  EQUAL: 'Égal',
  SHARES: 'Parts',
  EXACT: 'Exact',
};

export default function MembersPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'currency' | 'split' | 'edit' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(false);

  const load = () => {
    if (!session?.accessToken || !params?.id) return;
    apiFetch<TripDetail>(`/trips/${params.id}`)
      .then(setTrip)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  };

  useEffect(load, [session?.accessToken, params?.id]);

  const updateRole = async (userId: string, role: 'ADMIN' | 'MEMBER') => {
    if (!trip) return;
    setBusy(userId);
    setError(null);
    try {
      await apiFetch(`/trips/${trip.id}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(null);
    }
  };

  const deleteTrip = async () => {
    if (!trip || deletingTrip) return;
    if (
      !window.confirm(
        `Supprimer définitivement "${trip.title}" et toutes ses données (dépenses, itinéraire, documents) ?`,
      )
    )
      return;
    setDeletingTrip(true);
    setError(null);
    try {
      await apiFetch(`/trips/${trip.id}`, { method: 'DELETE' });
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setDeletingTrip(false);
    }
  };

  const leaveTrip = async () => {
    if (!trip || leaving) return;
    const lastMember = trip.members.length === 1;
    const msg = lastMember
      ? 'Tu es seul·e dans ce voyage : le quitter le supprimera définitivement. Confirmer ?'
      : 'Quitter ce voyage ? Tes dépenses et soldes restent visibles aux autres membres.';
    if (!window.confirm(msg)) return;
    setLeaving(true);
    setError(null);
    try {
      await apiFetch(`/trips/${trip.id}/leave`, { method: 'DELETE' });
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setLeaving(false);
    }
  };

  const updateTrip = async (
    patch: Partial<{
      title: string;
      destination: string | null;
      startDate: string | null;
      endDate: string | null;
      ambiance: TripAmbiance | null;
      currency: string;
      budget: number | null;
      defaultSplitMethod: SplitMethod;
    }>,
  ) => {
    if (!trip) return;
    setError(null);
    try {
      await apiFetch(`/trips/${trip.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      load();
      setSheet(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  if (!trip) {
    return (
      <main className="flex min-h-screen flex-col pb-12">
        <header className="flex items-center justify-between bg-surface px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-bg text-ink"
          >
            <IcArrowL size={18} sw={2} />
          </button>
          <h1 className="text-[16px] font-bold text-ink">Équipe du voyage</h1>
          <div className="w-9" />
        </header>
        <LoadingFallback
          onRetry={load}
          skeleton={
            <div className="flex flex-col gap-3 p-4">
              <div className="px-1 pb-1">
                <Skeleton width={120} height={11} radius={3} />
              </div>
              <Card padding={0}>
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 px-3.5 py-3">
                      <SkeletonCircle size={36} />
                      <div className="min-w-0 flex-1">
                        <Skeleton width="50%" height={14} radius={3} />
                        <div className="mt-1.5">
                          <Skeleton width="70%" height={11} radius={3} />
                        </div>
                      </div>
                      <Skeleton width={56} height={22} radius={999} />
                    </div>
                    {i < 2 ? <div className="h-px bg-line" /> : null}
                  </div>
                ))}
              </Card>
              <div className="px-1 pb-1 pt-2">
                <Skeleton width={160} height={11} radius={3} />
              </div>
              <Card padding={0}>
                {[0, 1].map((i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between px-3.5 py-3">
                      <Skeleton width={150} height={13} radius={3} />
                      <Skeleton width={70} height={12} radius={3} />
                    </div>
                    {i < 1 ? <div className="h-px bg-line" /> : null}
                  </div>
                ))}
              </Card>
            </div>
          }
        />
      </main>
    );
  }

  const me = trip.members.find((m) => m.id === session?.userId);
  const isAdmin = me?.role === 'ADMIN';

  return (
    <main className="flex min-h-screen flex-col pb-12">
      <header className="flex items-center justify-between bg-surface px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-bg text-ink"
        >
          <IcArrowL size={18} sw={2} />
        </button>
        <h1 className="text-[16px] font-bold text-ink">Équipe du voyage</h1>
        <div className="w-9" />
      </header>

      <div className="flex flex-col gap-3 p-4">
        {isAdmin ? <InviteButton tripId={trip.id} /> : null}

        <div>
          <div className="px-1 pb-2">
            <Label noMargin>
              Membres · {trip.members.length}
            </Label>
          </div>
          <Card padding={0}>
            {trip.members.map((m, i) => (
              <div key={m.id}>
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <Avatar id={m.id} name={m.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-ink">
                      {m.name}
                      {m.id === session?.userId ? (
                        <span className="ml-1 text-[11px] font-medium text-ink-3">· toi</span>
                      ) : null}
                    </div>
                    <div className="truncate text-[11.5px] font-medium text-ink-3">{m.email}</div>
                  </div>
                  {isAdmin && m.id !== session?.userId ? (
                    <RoleMenu
                      current={m.role}
                      busy={busy === m.id}
                      onChange={(role) => updateRole(m.id, role)}
                    />
                  ) : (
                    <Chip tone={m.role === 'ADMIN' ? 'dark' : 'default'} size="sm">
                      {m.role === 'ADMIN' ? 'Admin' : 'Membre'}
                    </Chip>
                  )}
                </div>
                {i < trip.members.length - 1 ? <div className="h-px bg-line" /> : null}
              </div>
            ))}
          </Card>
          {error ? <p className="mt-2 text-sm text-neg">{error}</p> : null}
        </div>

        <div>
          <div className="px-1 pb-2">
            <Label noMargin>Préférences du groupe</Label>
          </div>
          <Card padding={0}>
            <PrefRow
              label="Devise principale"
              value={`${trip.currency} · ${currencySymbol(trip.currency)}`}
              disabled={!isAdmin}
              onClick={isAdmin ? () => setSheet('currency') : undefined}
            />
            <div className="h-px bg-line" />
            <PrefRow
              label="Méthode de partage par défaut"
              value={SPLIT_LABELS[trip.defaultSplitMethod]}
              disabled={!isAdmin}
              onClick={isAdmin ? () => setSheet('split') : undefined}
            />
          </Card>
          {!isAdmin ? (
            <p className="mt-2 px-1 text-[11px] text-ink-3">
              Seuls les administrateurs peuvent modifier ces réglages.
            </p>
          ) : null}
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => setSheet('edit')}
            className="mt-2 inline-flex items-center justify-center rounded-input bg-ink px-5 py-3 text-[14px] font-bold text-white"
          >
            Modifier le voyage
          </button>
        ) : null}

        <button
          type="button"
          onClick={leaveTrip}
          disabled={leaving}
          className="mt-2 inline-flex items-center justify-center rounded-input border border-line2 bg-surface px-5 py-3 text-[14px] font-bold text-neg disabled:opacity-50"
        >
          {leaving ? 'Sortie en cours…' : 'Quitter le voyage'}
        </button>

        {isAdmin ? (
          <button
            type="button"
            onClick={deleteTrip}
            disabled={deletingTrip}
            className="mt-1 inline-flex items-center justify-center rounded-input border border-neg/40 bg-surface px-5 py-3 text-[13px] font-bold text-neg disabled:opacity-50"
          >
            {deletingTrip ? 'Suppression…' : 'Supprimer le voyage'}
          </button>
        ) : null}
      </div>

      {sheet === 'currency' ? (
        <Sheet title="Devise principale" onClose={() => setSheet(null)}>
          <div className="px-2 pb-3">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => updateTrip({ currency: c.code })}
                className="flex w-full items-center justify-between rounded-card px-3 py-3 text-left hover:bg-bg"
              >
                <div>
                  <div className="text-[14px] font-semibold text-ink">{c.label}</div>
                  <div className="text-[12px] text-ink-3">{c.code}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-ink-3">{c.symbol}</span>
                  {trip.currency === c.code ? (
                    <span className="text-[14px] font-bold text-accent">✓</span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </Sheet>
      ) : null}

      {sheet === 'split' ? (
        <Sheet title="Méthode de partage" onClose={() => setSheet(null)}>
          <div className="px-2 pb-3">
            {(Object.keys(SPLIT_LABELS) as SplitMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => updateTrip({ defaultSplitMethod: method })}
                className="flex w-full items-center justify-between rounded-card px-3 py-3 text-left hover:bg-bg"
              >
                <div>
                  <div className="text-[14px] font-semibold text-ink">{SPLIT_LABELS[method]}</div>
                  <div className="text-[12px] text-ink-3">{splitHint(method)}</div>
                </div>
                {trip.defaultSplitMethod === method ? (
                  <span className="text-[14px] font-bold text-accent">✓</span>
                ) : null}
              </button>
            ))}
          </div>
        </Sheet>
      ) : null}

      {sheet === 'edit' ? (
        <EditTripSheet
          trip={trip}
          onClose={() => setSheet(null)}
          onSave={updateTrip}
          onCoverChanged={load}
        />
      ) : null}
    </main>
  );
}

function EditTripSheet({
  trip,
  onClose,
  onSave,
  onCoverChanged,
}: {
  trip: TripDetail;
  onClose: () => void;
  onSave: (patch: {
    title?: string;
    destination?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    ambiance?: TripAmbiance | null;
    budget?: number | null;
  }) => Promise<void> | void;
  onCoverChanged: () => void;
}) {
  const { data: session } = useSession();
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination ?? '');
  const [startDate, setStartDate] = useState(
    trip.startDate ? new Date(trip.startDate).toISOString().slice(0, 10) : '',
  );
  const [endDate, setEndDate] = useState(
    trip.endDate ? new Date(trip.endDate).toISOString().slice(0, 10) : '',
  );
  const [ambiance, setAmbiance] = useState<TripAmbiance | ''>(trip.ambiance ?? '');
  const [budget, setBudget] = useState(trip.budget !== null ? String(trip.budget) : '');
  const [saving, setSaving] = useState(false);
  const [coverVersion, setCoverVersion] = useState(0);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadCover = async (file: File) => {
    if (!session?.accessToken) return;
    setCoverError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCoverError(`Format non supporté: ${file.type}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError('Image trop volumineuse (5 MB max)');
      return;
    }
    setCoverBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${env.apiUrl}/api/trips/${trip.id}/cover`, {
        method: 'POST',
        headers: { authorization: `Bearer ${session.accessToken}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      setCoverVersion((v) => v + 1);
      onCoverChanged();
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setCoverBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeCover = async () => {
    if (coverBusy) return;
    setCoverError(null);
    setCoverBusy(true);
    try {
      await apiFetch(`/trips/${trip.id}/cover`, { method: 'DELETE' });
      setCoverVersion((v) => v + 1);
      onCoverChanged();
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setCoverBusy(false);
    }
  };

  const coverUrl =
    trip.hasCover && coverVersion >= 0
      ? `${env.apiUrl}/api/trips/${trip.id}/cover?v=${coverVersion}`
      : null;

  const save = async () => {
    setSaving(true);
    const budgetNum = budget.trim() === '' ? null : Number(budget.replace(',', '.'));
    await onSave({
      title: title.trim(),
      destination: destination.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      ambiance: ambiance || null,
      budget: budgetNum && !Number.isNaN(budgetNum) ? budgetNum : null,
    });
    setSaving(false);
  };

  return (
    <Sheet
      onClose={onClose}
      title="Modifier le voyage"
      action={
        <button
          type="button"
          onClick={save}
          disabled={saving || title.trim().length === 0}
          className="rounded-[9px] bg-ink px-3 py-[7px] text-[12px] font-bold text-white disabled:opacity-40"
        >
          {saving ? '…' : 'Enregistrer'}
        </button>
      }
    >
      <div className="space-y-4 px-4 pb-6 pt-2">
        <div>
          <Label>Image d'affiche</Label>
          <div className="relative overflow-hidden rounded-card bg-bg" style={{ aspectRatio: '16 / 9' }}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-ink-3">
                Aucune image
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadCover(f);
            }}
            className="hidden"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={coverBusy}
              className="flex-1 rounded-input bg-bg px-3 py-2 text-[12.5px] font-semibold text-ink disabled:opacity-50"
            >
              {coverBusy ? 'Envoi…' : trip.hasCover ? 'Changer' : 'Choisir une image'}
            </button>
            {trip.hasCover ? (
              <button
                type="button"
                onClick={removeCover}
                disabled={coverBusy}
                className="rounded-input border border-line2 px-3 py-2 text-[12.5px] font-semibold text-neg disabled:opacity-50"
              >
                Retirer
              </button>
            ) : null}
          </div>
          {coverError ? <p className="mt-1 text-[12px] text-neg">{coverError}</p> : null}
        </div>

        <label className="block">
          <Label>Titre</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="input"
          />
        </label>

        <label className="block">
          <Label>Destination</Label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            maxLength={120}
            placeholder="Ex. Lisbonne, Portugal"
            className="input"
          />
        </label>

        <div className="flex gap-2">
          <label className="flex-1">
            <Label>Début</Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </label>
          <label className="flex-1">
            <Label>Fin</Label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </label>
        </div>

        <div>
          <Label>Ambiance</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(AMBIANCE_LABELS) as TripAmbiance[]).map((amb) => {
              const active = amb === ambiance;
              return (
                <button
                  key={amb}
                  type="button"
                  onClick={() => setAmbiance(active ? '' : amb)}
                  className={`rounded-pill px-3 py-1.5 text-[12.5px] font-semibold ${
                    active ? 'bg-ink text-white' : 'bg-bg text-ink-2'
                  }`}
                >
                  {AMBIANCE_LABELS[amb]}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          <Label>Budget ({trip.currency})</Label>
          <input
            type="text"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^\d.,]/g, ''))}
            placeholder="Laisser vide pour aucun budget"
            className="input"
          />
        </label>
      </div>
    </Sheet>
  );
}

function splitHint(method: SplitMethod): string {
  switch (method) {
    case 'EQUAL':
      return 'Partagé également entre tous';
    case 'SHARES':
      return 'Par parts pondérées';
    case 'EXACT':
      return 'Montants exacts par personne';
  }
}

function PrefRow({
  label,
  value,
  onClick,
  disabled,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="text-[13px] font-semibold text-ink">{label}</div>
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3">
        {value}
        {!disabled ? <IcArrowR size={14} sw={2} /> : null}
      </div>
    </>
  );
  if (disabled || !onClick) {
    return (
      <div className="flex items-center justify-between px-3.5 py-3">{content}</div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-3.5 py-3 text-left hover:bg-bg"
    >
      {content}
    </button>
  );
}

function RoleMenu({
  current,
  busy,
  onChange,
}: {
  current: 'ADMIN' | 'MEMBER';
  busy: boolean;
  onChange: (role: 'ADMIN' | 'MEMBER') => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className={
          current === 'ADMIN'
            ? 'rounded-pill bg-ink px-2.5 py-1 text-[12px] font-semibold text-white'
            : 'rounded-pill bg-[rgba(47,69,80,0.07)] px-2.5 py-1 text-[12px] font-semibold text-ink-2'
        }
      >
        {busy ? '…' : current === 'ADMIN' ? 'Admin ▾' : 'Membre ▾'}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-card bg-surface shadow-card-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (current !== 'ADMIN') onChange('ADMIN');
            }}
            className="block w-full px-3 py-2 text-left text-[12px] font-medium hover:bg-bg"
          >
            {current === 'ADMIN' ? '✓ ' : ''}Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (current !== 'MEMBER') onChange('MEMBER');
            }}
            className="block w-full px-3 py-2 text-left text-[12px] font-medium hover:bg-bg"
          >
            {current === 'MEMBER' ? '✓ ' : ''}Membre
          </button>
        </div>
      ) : null}
    </div>
  );
}

function currencySymbol(code: string): string {
  switch (code) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    case 'JPY':
      return '¥';
    case 'CAD':
      return 'CA$';
    case 'CHF':
      return 'CHF';
    default:
      return code;
  }
}
