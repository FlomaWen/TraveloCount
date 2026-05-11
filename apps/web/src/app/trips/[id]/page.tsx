'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch, ApiError } from '@/lib/api-client';
import {
  Avatar,
  AvatarStack,
  Card,
  Chip,
  Money,
  coverFromId,
  DotGridOverlay,
  SkylineOverlay,
} from '@/components/atoms';
import { IcArrowL, IcArrowR, IcReceipt, IcSparkle, IcSwap, IcUsers } from '@/components/icons';
import { TabBar } from '@/components/tab-bar';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

interface TripDetail {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  currency: string;
  budget: number | null;
  totalSpent: number;
  userBalance: number;
  status: 'IN_PROGRESS' | 'UPCOMING' | 'PAST' | 'UNDATED';
  dayNumber: number | null;
  totalDays: number | null;
  members: Member[];
}

interface Settlement {
  from: { id: string; name: string };
  to: { id: string; name: string };
  amount: number;
}

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken || !params?.id) return;
    apiFetch<TripDetail>(`/trips/${params.id}`)
      .then(setTrip)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setError('Voyage introuvable');
        else if (e instanceof ApiError && e.status === 403) setError('Tu n\'es pas membre de ce voyage');
        else setError(e instanceof Error ? e.message : 'Erreur');
      });
    apiFetch<{ settlements: Settlement[] }>(`/trips/${params.id}/balances`)
      .then((r) => setSettlements(r.settlements))
      .catch(() => undefined);
  }, [session?.accessToken, params?.id]);

  if (error) {
    return (
      <main className="p-6">
        <button onClick={() => router.back()} className="text-ink-3">
          ← Retour
        </button>
        <p className="mt-6 text-neg">{error}</p>
      </main>
    );
  }

  if (!trip) return <main className="p-6 text-sm text-ink-3">Chargement…</main>;

  const myOutgoingSettlements = settlements.filter((s) => s.from.id === session?.userId);
  const budgetPct = trip.budget && trip.budget > 0 ? trip.totalSpent / trip.budget : 0;
  const overBudget = budgetPct > 1;

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header sombre avec cover */}
      <header
        className="relative overflow-hidden px-4 pb-4 pt-2 text-white"
        style={{ background: coverFromId(trip.id) }}
      >
        <DotGridOverlay opacity={0.14} />
        <SkylineOverlay opacity={0.22} height={80} />

        <div className="relative flex items-center justify-between">
          <button
            onClick={() => router.back()}
            aria-label="Retour"
            className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-white/15 text-white hover:bg-white/25"
          >
            <IcArrowL size={18} sw={2} />
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Discussion"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-btn bg-white/15 text-white hover:bg-white/25"
            >
              <IcSparkle size={18} sw={1.8} />
              <span
                className="absolute h-[7px] w-[7px] rounded-full bg-accent"
                style={{ top: 8, right: 8, boxShadow: '0 0 0 2px rgba(47,69,80,0.6)' }}
              />
            </button>
            <Link
              href={`/trips/${trip.id}/members`}
              aria-label="Membres"
              className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-white/15 text-white hover:bg-white/25"
            >
              <IcUsers size={18} sw={1.8} />
            </Link>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="flex items-center gap-2">
            <StatusChip trip={trip} />
          </div>
          <h1 className="mt-2.5 text-h1-onb text-white">{trip.title}</h1>
          <p className="mt-1 text-[13px] font-medium text-white/70">
            {formatDates(trip.startDate, trip.endDate)} · {trip.members.length} personne
            {trip.members.length > 1 ? 's' : ''}
          </p>

          {/* Stats inline */}
          <div className="mt-4 flex items-center gap-4">
            <div>
              <div className="label-up !text-white/60">Dépensé</div>
              <Money value={trip.totalSpent} size={18} weight={700} color="#fff" dim="rgba(255,255,255,0.7)" currency={currency(trip.currency)} />
            </div>
            {trip.budget !== null ? (
              <>
                <div className="h-7 w-px bg-white/20" />
                <div>
                  <div className="label-up !text-white/60">Budget</div>
                  <Money value={trip.budget} size={18} weight={700} color="#fff" dim="rgba(255,255,255,0.7)" currency={currency(trip.currency)} />
                </div>
              </>
            ) : null}
            <div className="ml-auto">
              <AvatarStack members={trip.members} size={28} />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <TabBar tripId={trip.id} active="overview" />

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 pb-8">
        {/* Card "Ta position" */}
        <Card padding={0}>
          <div className="flex items-center justify-between p-[14px_16px_6px]">
            <div className="text-[14px] font-bold text-ink">Ta position</div>
            <Link
              href={`/trips/${trip.id}/accounts`}
              className="flex items-center gap-1 rounded-[9px] bg-ink px-2.5 py-[7px] text-[11.5px] font-bold text-white"
            >
              <IcSwap size={13} sw={2} /> Régler
            </Link>
          </div>
          <div className="px-4 pb-3.5">
            <div className="flex items-baseline gap-2">
              <Money
                value={trip.userBalance}
                size={26}
                weight={700}
                color={trip.userBalance < 0 ? '#A0496B' : trip.userBalance > 0 ? '#2F7A6A' : '#0C1A22'}
                sign={trip.userBalance < 0 ? 'neg' : trip.userBalance > 0 ? 'pos' : 'none'}
                currency={currency(trip.currency)}
              />
              <span className="text-[12px] font-semibold text-ink-3">
                {trip.userBalance < 0 ? 'à reverser au groupe' : trip.userBalance > 0 ? 'à recevoir' : 'à l\'équilibre'}
              </span>
            </div>
            {myOutgoingSettlements.length > 0 ? (
              <div className="mt-2.5 flex flex-col gap-2">
                {myOutgoingSettlements.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-[12px] bg-bg px-2.5 py-2">
                    <Avatar id={s.from.id} name={s.from.name} size={26} />
                    <IcArrowR size={14} sw={2} className="text-ink-3" />
                    <Avatar id={s.to.id} name={s.to.name} size={26} />
                    <div className="flex-1 text-[12.5px] font-semibold text-ink-2">
                      Tu dois à {s.to.name.split(' ')[0]}
                    </div>
                    <Money value={s.amount} size={13} weight={700} color="#A0496B" currency={currency(trip.currency)} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        {/* Card Budget */}
        {trip.budget !== null ? (
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <div className="label-up">Budget · {Math.round(budgetPct * 100)}% utilisé</div>
                <div className="mt-1.5">
                  <Money value={trip.totalSpent} size={20} weight={700} color="#0C1A22" currency={currency(trip.currency)} />
                  <span className="mono ml-1.5 text-[13px] font-medium text-ink-3">
                    / {trip.budget.toLocaleString('fr-FR')} {currency(trip.currency)}
                  </span>
                </div>
              </div>
              <Chip tone={overBudget ? 'neg' : 'pos'} size="sm">
                {overBudget ? '↗ Dépassé' : '↘ Dans le budget'}
              </Chip>
            </div>
            <div className="relative mt-3 h-2 overflow-hidden rounded-pill bg-bg">
              <div
                className="h-full rounded-pill"
                style={{
                  width: `${Math.min(budgetPct, 1) * 100}%`,
                  background: 'linear-gradient(90deg, #2F4550, #B8DBD9)',
                }}
              />
              {trip.dayNumber && trip.totalDays ? (
                <div
                  className="absolute -top-[3px] -bottom-[3px] w-0.5 bg-ink"
                  style={{ left: `${(trip.dayNumber / trip.totalDays) * 100}%` }}
                />
              ) : null}
            </div>
            {trip.dayNumber && trip.totalDays ? (
              <div className="mt-1.5 flex justify-between text-[10.5px] font-semibold tracking-[0.02em] text-ink-3">
                <span>Aujourd'hui · J{trip.dayNumber}</span>
                <span>Fin · J{trip.totalDays}</span>
              </div>
            ) : null}
          </Card>
        ) : null}

        {/* Destination card */}
        {trip.destination ? (
          <Card>
            <div className="label-up">Destination</div>
            <p className="mt-1 text-[14px] font-bold text-ink">{trip.destination}</p>
          </Card>
        ) : null}

        {/* Membres link */}
        <Link href={`/trips/${trip.id}/members`} className="block">
          <div className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card">
            <div>
              <div className="label-up">Membres ({trip.members.length})</div>
              <p className="mt-1 text-[14px] font-bold text-ink">
                {trip.members.slice(0, 3).map((m) => m.name.split(' ')[0]).join(', ')}
                {trip.members.length > 3 ? `, +${trip.members.length - 3}` : ''}
              </p>
            </div>
            <IcArrowR size={18} sw={2} className="text-ink-3" />
          </div>
        </Link>

        {/* Documents link */}
        <Link href={`/trips/${trip.id}/documents`} className="block">
          <div className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-bg text-ink-2">
                <IcReceipt size={18} sw={1.8} />
              </div>
              <div>
                <div className="label-up">Documents</div>
                <p className="mt-0.5 text-[13px] font-semibold text-ink">Billets, réservations…</p>
              </div>
            </div>
            <IcArrowR size={18} sw={2} className="text-ink-3" />
          </div>
        </Link>

        {/* Astuce */}
        <Card className="!bg-accent" padding={16}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px]"
              style={{ background: '#1F3E3A', color: '#B8DBD9' }}
            >
              <IcSparkle size={18} sw={1.8} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold" style={{ color: '#1F3E3A' }}>
                Astuce
              </div>
              <p className="mt-0.5 text-[12.5px] leading-[1.4]" style={{ color: '#1F3E3A' }}>
                Tu peux ajouter les dépenses dans n'importe quelle devise — elles seront converties automatiquement.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function StatusChip({ trip }: { trip: TripDetail }) {
  if (trip.status === 'IN_PROGRESS' && trip.dayNumber && trip.totalDays) {
    return <Chip tone="accent" size="sm">● EN COURS · JOUR {trip.dayNumber}/{trip.totalDays}</Chip>;
  }
  if (trip.status === 'UPCOMING') return <Chip tone="dark" size="sm">À venir</Chip>;
  if (trip.status === 'PAST') return <Chip tone="dark" size="sm">Passé</Chip>;
  return <Chip tone="dark" size="sm">Dates à définir</Chip>;
}

function currency(code: string): string {
  return code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code;
}

function formatDates(start: string | Date | null, end: string | Date | null): string {
  if (!start || !end) return 'Dates à définir';
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt(s)} → ${fmt(e)} ${e.getFullYear()}`;
}
