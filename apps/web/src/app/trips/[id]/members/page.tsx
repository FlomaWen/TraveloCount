'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Avatar, Card, Chip, Label } from '@/components/atoms';
import { IcArrowL, IcArrowR, IcSparkle } from '@/components/icons';
import { InviteButton } from '@/components/invite-button';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

interface TripDetail {
  id: string;
  title: string;
  currency: string;
  members: Member[];
}

export default function MembersPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (!trip) return <main className="p-6 text-sm text-ink-3">Chargement…</main>;

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
        {/* Invite card */}
        {isAdmin ? <InviteButton tripId={trip.id} /> : null}

        {/* Members list */}
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

        {/* Préférences groupe (stub visuel) */}
        <div>
          <div className="px-1 pb-2">
            <Label noMargin>Préférences du groupe</Label>
          </div>
          <Card padding={0}>
            <PrefRow label="Devise principale" value={`${trip.currency} · ${currencySymbol(trip.currency)}`} />
            <div className="h-px bg-line" />
            <PrefRow label="Méthode de partage par défaut" value="Égal" />
            <div className="h-px bg-line" />
            <PrefRow label="Notifications" value="Tous les événements" />
          </Card>
        </div>

        <button
          type="button"
          className="mt-2 inline-flex items-center justify-center rounded-input border border-line2 bg-surface px-5 py-3 text-[14px] font-bold text-neg"
        >
          Quitter le voyage
        </button>
      </div>
    </main>
  );
}

function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3">
      <div className="text-[13px] font-semibold text-ink">{label}</div>
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3">
        {value}
        <IcArrowR size={14} sw={2} />
      </div>
    </div>
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
  return code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code;
}
