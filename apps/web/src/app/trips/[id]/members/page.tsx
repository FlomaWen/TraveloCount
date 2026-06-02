'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { currencySymbol } from '@/lib/currency';
import { Avatar, Card, Chip, Label } from '@/components/atoms';
import { IcArrowL } from '@/components/icons';
import { InviteButton } from '@/components/invite-button';
import { Sheet } from '@/components/sheet';
import { LoadingFallback, Skeleton, SkeletonCircle } from '@/components/skeleton';
import {
  CURRENCIES,
  SPLIT_LABELS,
  splitHint,
  type SplitMethod,
  type TripAmbiance,
  type TripDetail,
} from './_constants';
import { EditTripSheet } from './_edit-trip-sheet';
import { PrefRow, RoleMenu } from './_member-row';

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
                  {trip.createdById === m.id ? (
                    <Chip tone="accent" size="sm">★ Créateur</Chip>
                  ) : isAdmin && m.id !== session?.userId ? (
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
