'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch, ApiError } from '@/lib/api-client';
import {
  AvatarStack,
  Chip,
  Money,
  coverFromId,
  DotGridOverlay,
  SkylineOverlay,
} from '@/components/atoms';
import { IcArrowL, IcSparkle, IcUsers } from '@/components/icons';
import { TabBar } from '@/components/tab-bar';
import { LoadingFallback, Skeleton, SkeletonCard } from '@/components/skeleton';
import { TripContext, type TripDetail } from '@/lib/trip-context';

export default function TripLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!session?.accessToken || !params?.id) return;
    apiFetch<TripDetail>(`/trips/${params.id}`)
      .then(setTrip)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setError('Voyage introuvable');
        else if (e instanceof ApiError && e.status === 403) setError('Tu n\'es pas membre de ce voyage');
        else setError(e instanceof Error ? e.message : 'Erreur');
      });
  }, [session?.accessToken, params?.id]);

  useEffect(load, [load]);

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

  if (!trip) {
    return (
      <main className="flex min-h-screen flex-col">
        <header
          className="relative overflow-hidden px-4 pb-4 pt-2 text-white"
          style={{ background: 'linear-gradient(135deg, #2F4550, #586F7C)' }}
        >
          <DotGridOverlay opacity={0.14} />
          <div className="relative flex items-center justify-between">
            <button
              onClick={() => router.back()}
              aria-label="Retour"
              className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-white/15 text-white"
            >
              <IcArrowL size={18} sw={2} />
            </button>
            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-btn bg-white/15" />
              <div className="h-9 w-9 rounded-btn bg-white/15" />
            </div>
          </div>
          <div className="relative mt-4">
            <Skeleton width={110} height={20} radius={999} />
            <div className="mt-2.5">
              <Skeleton width="70%" height={28} radius={6} />
            </div>
            <div className="mt-2">
              <Skeleton width="50%" height={14} radius={4} />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <Skeleton width={50} height={10} radius={3} />
                <Skeleton width={70} height={18} radius={4} />
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="flex flex-col gap-1.5">
                <Skeleton width={50} height={10} radius={3} />
                <Skeleton width={70} height={18} radius={4} />
              </div>
            </div>
          </div>
        </header>
        <nav className="flex gap-1 border-y border-line bg-surface p-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={40} className="flex-1" radius={10} />
          ))}
        </nav>
        <LoadingFallback
          onRetry={load}
          skeleton={
            <div className="flex flex-col gap-3 p-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          }
        />
      </main>
    );
  }

  const active = activeTabFromPath(pathname, trip.id);

  return (
    <TripContext.Provider value={{ trip, refresh: load }}>
      <main className="flex min-h-screen flex-col">
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

            <div className="mt-4 flex items-center gap-4">
              <div>
                <div className="label-up !text-white/60">Dépensé</div>
                <Money
                  value={trip.totalSpent}
                  size={18}
                  weight={700}
                  color="#fff"
                  dim="rgba(255,255,255,0.7)"
                  currency={currency(trip.currency)}
                />
              </div>
              {trip.budget !== null ? (
                <>
                  <div className="h-7 w-px bg-white/20" />
                  <div>
                    <div className="label-up !text-white/60">Budget</div>
                    <Money
                      value={trip.budget}
                      size={18}
                      weight={700}
                      color="#fff"
                      dim="rgba(255,255,255,0.7)"
                      currency={currency(trip.currency)}
                    />
                  </div>
                </>
              ) : null}
              <div className="ml-auto">
                <AvatarStack members={trip.members} size={28} />
              </div>
            </div>
          </div>
        </header>

        <TabBar tripId={trip.id} active={active} />

        {children}
      </main>
    </TripContext.Provider>
  );
}

function activeTabFromPath(pathname: string | null, tripId: string): 'overview' | 'expenses' | 'itinerary' | 'balance' {
  if (!pathname) return 'overview';
  if (pathname.endsWith('/expenses')) return 'expenses';
  if (pathname.endsWith('/itinerary')) return 'itinerary';
  if (pathname.endsWith('/accounts')) return 'balance';
  return 'overview';
}

function StatusChip({ trip }: { trip: TripDetail }) {
  if (trip.status === 'IN_PROGRESS' && trip.dayNumber && trip.totalDays) {
    return (
      <Chip tone="accent" size="sm">
        ● EN COURS · JOUR {trip.dayNumber}/{trip.totalDays}
      </Chip>
    );
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
