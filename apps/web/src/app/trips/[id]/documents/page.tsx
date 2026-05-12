'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Avatar, Card, Chip, Label } from '@/components/atoms';
import { IcArrowL, IcCamera, IcPlus, IcReceipt } from '@/components/icons';
import { LoadingFallback, Skeleton, SkeletonCircle } from '@/components/skeleton';
import { Sheet } from '@/components/sheet';
import { env } from '@/lib/env';

interface ExpenseRef {
  id: string;
  label: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
}

interface Doc {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploader: { id: string; name: string };
  linkedExpenseId: string | null;
}

interface TripRef {
  id: string;
  title: string;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export default function DocumentsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripRef | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRef[]>([]);
  const [uploading, setUploading] = useState(false);
  const [linking, setLinking] = useState<Doc | null>(null);
  const [linkingBusy, setLinkingBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const expenseMap = new Map(expenses.map((e) => [e.id, e]));

  const load = async () => {
    if (!session?.accessToken || !params?.id) return;
    try {
      const [t, list, exps] = await Promise.all([
        apiFetch<TripRef>(`/trips/${params.id}`),
        apiFetch<Doc[]>(`/trips/${params.id}/documents`),
        apiFetch<ExpenseRef[]>(`/trips/${params.id}/expenses`),
      ]);
      setTrip(t);
      setDocs(list);
      setExpenses(exps);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const linkDocument = async (documentId: string, expenseId: string | null) => {
    if (linkingBusy) return;
    setLinkingBusy(true);
    setError(null);
    try {
      await apiFetch(`/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ linkedExpenseId: expenseId }),
      });
      setLinking(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLinkingBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [session?.accessToken, params?.id]);

  const upload = async (file: File) => {
    if (!params?.id || !session?.accessToken) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError(`Format non supporté: ${file.type}`);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Fichier trop volumineux (10 MB max)');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${env.apiUrl}/api/trips/${params.id}/documents`, {
        method: 'POST',
        headers: { authorization: `Bearer ${session.accessToken}` },
        body: form,
      });
      if (!res.ok) throw new ApiError(res.status, await res.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const download = async (doc: Doc) => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${env.apiUrl}/api/documents/${doc.id}`, {
        headers: { authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur téléchargement');
    }
  };

  if (!trip) {
    if (error) return <main className="p-6 text-sm text-neg">{error}</main>;
    return (
      <main className="flex min-h-screen flex-col pb-24">
        <header className="flex items-center justify-between bg-surface px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-bg text-ink"
          >
            <IcArrowL size={18} sw={2} />
          </button>
          <h1 className="text-[16px] font-bold text-ink">Documents</h1>
          <div className="w-9" />
        </header>
        <LoadingFallback
          onRetry={load}
          skeleton={
            <div className="flex flex-col gap-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
                  <SkeletonCircle size={40} />
                  <div className="flex-1">
                    <Skeleton width="70%" height={13} radius={3} />
                    <div className="mt-1.5">
                      <Skeleton width="50%" height={11} radius={3} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col pb-24">
      <header className="flex items-center justify-between bg-surface px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-bg text-ink"
        >
          <IcArrowL size={18} sw={2} />
        </button>
        <div className="text-center">
          <div className="label-up">{trip.title}</div>
          <h1 className="text-[16px] font-bold text-ink">Documents</h1>
        </div>
        <div className="w-9" />
      </header>

      <div className="flex flex-col gap-3 p-4">
        {/* Upload zone */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent text-accent-ink">
              <IcCamera size={18} sw={1.8} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">Joindre un document</div>
              <div className="text-[11.5px] text-ink-3">PDF, JPG, PNG · 10 MB max</div>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-accent h-[42px] px-4 text-[12.5px]"
            >
              {uploading ? '…' : 'Uploader'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </Card>

        {error ? <p className="text-sm text-neg">{error}</p> : null}

        {/* List */}
        <div>
          <div className="px-1 pb-2">
            <Label noMargin>
              {docs.length} document{docs.length > 1 ? 's' : ''}
            </Label>
          </div>
          {docs.length === 0 ? (
            <Card className="text-center text-sm text-ink-3">
              Aucun document pour ce voyage.
            </Card>
          ) : (
            <Card padding={0}>
              {docs.map((d, i) => {
                const linkedExpense = d.linkedExpenseId ? expenseMap.get(d.linkedExpenseId) : null;
                return (
                  <div key={d.id}>
                    <div className="flex flex-col gap-2 px-3.5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-bg text-ink-2">
                          <IcReceipt size={18} sw={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13.5px] font-semibold leading-tight text-ink">
                            {d.filename}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-3">
                            <Avatar id={d.uploader.id} name={d.uploader.name} size={16} />
                            <span className="font-medium">{d.uploader.name.split(' ')[0]}</span>
                            <span className="text-mute">·</span>
                            <span>{formatSize(d.sizeBytes)}</span>
                            <span className="text-mute">·</span>
                            <span>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => download(d)}
                          className="rounded-pill bg-ink px-3 py-1.5 text-[11.5px] font-bold text-white"
                        >
                          Télécharger
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pl-[52px]">
                        {linkedExpense ? (
                          <Chip tone="accent" size="sm">
                            🔗 {linkedExpense.label}
                          </Chip>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setLinking(d)}
                          className="rounded-pill border border-line2 px-2.5 py-1 text-[11px] font-semibold text-ink-3 hover:bg-bg"
                        >
                          {linkedExpense ? 'Modifier le lien' : 'Lier à une dépense'}
                        </button>
                      </div>
                    </div>
                    {i < docs.length - 1 ? <div className="h-px bg-line" /> : null}
                  </div>
                );
              })}
            </Card>
          )}
          <p className="mt-2 text-[11px] text-ink-3">
            💡 Les documents téléchargés sont disponibles hors ligne grâce au cache du navigateur.
          </p>
        </div>
      </div>

      {linking ? (
        <Sheet
          title="Lier à une dépense"
          onClose={() => setLinking(null)}
          action={
            linking.linkedExpenseId ? (
              <button
                type="button"
                onClick={() => linkDocument(linking.id, null)}
                disabled={linkingBusy}
                className="rounded-[9px] border border-neg/40 px-3 py-[7px] text-[12px] font-bold text-neg disabled:opacity-40"
              >
                Délier
              </button>
            ) : undefined
          }
        >
          <div className="px-2 pb-3">
            {expenses.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-ink-3">
                Aucune dépense dans ce voyage.
              </p>
            ) : (
              expenses.map((e) => {
                const selected = linking.linkedExpenseId === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => linkDocument(linking.id, e.id)}
                    disabled={linkingBusy}
                    className="flex w-full items-center gap-3 rounded-card px-3 py-3 text-left hover:bg-bg disabled:opacity-50"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-bg text-ink-2">
                      <IcReceipt size={16} sw={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-ink">{e.label}</div>
                      <div className="mt-0.5 text-[11.5px] text-ink-3">
                        {new Date(e.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        ·{' '}
                        {e.amount.toFixed(2).replace('.', ',')}
                        {e.currency === 'EUR' ? '€' : e.currency}
                      </div>
                    </div>
                    {selected ? (
                      <span className="text-[14px] font-bold text-accent">✓</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </Sheet>
      ) : null}
    </main>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
