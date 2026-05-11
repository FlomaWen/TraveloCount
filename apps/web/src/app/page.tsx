'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { TripCardLarge, TripCardSmall } from '@/components/trip-card';
import { Money, RoundBtn } from '@/components/atoms';
import { IcSearch, IcBell, IcSwap, IcChart, IcPlus } from '@/components/icons';
import { BottomNav } from '@/components/bottom-nav';

interface Trip {
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
  members: { id: string; name: string }[];
}

export default function HomePage() {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiFetch<Trip[]>('/trips')
      .then(setTrips)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, [session?.accessToken]);

  const active = trips?.filter((t) => t.status === 'IN_PROGRESS') ?? [];
  const upcoming = trips?.filter((t) => t.status === 'UPCOMING' || t.status === 'UNDATED') ?? [];
  const past = trips?.filter((t) => t.status === 'PAST') ?? [];
  const totalDue = trips?.reduce((s, t) => s + t.userBalance, 0) ?? 0;

  const firstName = session?.user?.name?.split(' ')[0] ?? 'voyageur';

  return (
    <main className="min-h-screen pb-24">
      {/* App header */}
      <header className="flex items-center justify-between px-5 pb-1.5 pt-3">
        <div>
          <div className="label-up">Bonjour {firstName}</div>
          <h1 className="mt-0.5 text-h1-screen text-ink">TraveloCount</h1>
        </div>
        <div className="flex gap-2">
          <RoundBtn aria-label="Rechercher">
            <IcSearch size={18} sw={1.8} />
          </RoundBtn>
          <Link
            href="/activity"
            aria-label="Activité"
            className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-btn border border-line2 bg-surface text-ink hover:bg-bg"
          >
            <IcBell size={18} sw={1.8} />
            <span
              className="absolute h-[7px] w-[7px] rounded-full bg-neg"
              style={{ top: 9, right: 10, boxShadow: '0 0 0 2px #FFFFFF' }}
            />
          </Link>
        </div>
      </header>

      {/* Solde global */}
      <section className="px-4 py-3.5">
        <div className="relative overflow-hidden rounded-card-lg bg-ink p-[18px_20px] text-white">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-[180px] w-[180px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(184,219,217,0.35) 0%, rgba(184,219,217,0) 70%)',
            }}
          />
          <div className="relative">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">
              Solde global · tous voyages
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <Money
                value={totalDue}
                size={32}
                weight={700}
                color="#fff"
                dim="rgba(255,255,255,0.55)"
                sign={totalDue < 0 ? 'neg' : totalDue > 0 ? 'pos' : 'none'}
              />
              <span className="text-[13px] text-white/60">
                {totalDue < 0 ? 'à payer' : totalDue > 0 ? 'à recevoir' : 'tout est équilibré'}
              </span>
            </div>
            <div className="mt-3.5 flex gap-2">
              <button
                type="button"
                className="flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-btn bg-accent text-[13px] font-bold tracking-[0.01em] text-accent-ink"
              >
                <IcSwap size={15} sw={2} />
                Régler les comptes
              </button>
              <button
                type="button"
                className="flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-btn border border-white/20 text-[13px] font-semibold text-white"
              >
                <IcChart size={15} sw={1.8} />
                Voir le détail
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? <p className="px-5 text-sm text-neg">{error}</p> : null}

      {/* En cours */}
      {active.length > 0 ? (
        <>
          <SectionTitle
            label="En cours"
            right={
              <span className="text-[11px] font-semibold text-ink-3">
                {active.length} voyage{active.length > 1 ? 's' : ''}
              </span>
            }
          />
          <div className="flex flex-col gap-3 px-4">
            {active.map((t) => (
              <TripCardLarge key={t.id} trip={t} />
            ))}
          </div>
        </>
      ) : null}

      {/* À venir */}
      <SectionTitle
        label="À venir"
        right={
          <Link href="/trips/new" className="flex items-center gap-1 text-[12px] font-bold text-ink">
            Nouveau voyage <IcPlus size={14} sw={2.2} />
          </Link>
        }
      />
      <div className="flex flex-col gap-2.5 px-4">
        {upcoming.map((t) => (
          <TripCardSmall key={t.id} trip={t} />
        ))}
        {upcoming.length === 0 && trips !== null ? (
          <div className="rounded-card bg-surface p-4 text-center text-sm text-ink-3">
            Aucun voyage à venir
          </div>
        ) : null}
      </div>

      {/* Passés */}
      {past.length > 0 ? (
        <>
          <SectionTitle label="Passés" />
          <div className="flex flex-col gap-2.5 px-4 pb-6">
            {past.map((t) => (
              <TripCardSmall key={t.id} trip={t} muted />
            ))}
          </div>
        </>
      ) : null}

      <BottomNav />
    </main>
  );
}

function SectionTitle({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pb-2.5 pt-5.5">
      <div className="text-[14px] font-bold tracking-[-0.01em] text-ink">{label}</div>
      {right}
    </div>
  );
}
