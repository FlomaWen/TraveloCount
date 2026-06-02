'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Avatar, Card, Chip, Money } from '@/components/atoms';
import { BottomNav } from '@/components/bottom-nav';
import { IcArrowL, IcArrowR, IcSwap } from '@/components/icons';
import { LoadingFallback, Skeleton, SkeletonCircle } from '@/components/skeleton';
import { currencySymbol } from '@/lib/currency';

interface TripDebt {
  tripId: string;
  tripTitle: string;
  currency: string;
  amount: number;
}

interface PersonSummary {
  user: { id: string; name: string; avatarUrl: string | null };
  byCurrency: { currency: string; amount: number }[];
  trips: TripDebt[];
}

export default function AccountsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<PersonSummary[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!session?.accessToken) return;
    apiFetch<PersonSummary[]>('/accounts/summary')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  };

  useEffect(load, [session?.accessToken]);

  return (
    <main className="min-h-screen pb-24">
      <header className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-bg text-ink"
        >
          <IcArrowL size={18} sw={2} />
        </button>
        <div className="text-center">
          <div className="label-up">Vue globale</div>
          <h1 className="text-[16px] font-bold text-ink">Mes comptes</h1>
        </div>
        <div className="w-9" />
      </header>

      <div className="px-4 pt-2">
        {error ? <p className="text-sm text-neg">{error}</p> : null}

        {!data ? (
          <LoadingFallback
            onRetry={load}
            skeleton={
              <Card padding={0}>
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 px-3.5 py-3.5">
                      <SkeletonCircle size={40} />
                      <div className="flex-1">
                        <Skeleton width="60%" height={14} radius={3} />
                        <div className="mt-1.5">
                          <Skeleton width="40%" height={11} radius={3} />
                        </div>
                      </div>
                      <Skeleton width={70} height={16} radius={4} />
                    </div>
                    {i < 2 ? <div className="ml-[64px] h-px bg-line" /> : null}
                  </div>
                ))}
              </Card>
            }
          />
        ) : data.length === 0 ? (
          <Card className="text-center">
            <div className="text-[14px] font-bold text-pos">✓ Tous comptes équilibrés</div>
            <p className="mt-1.5 text-[12.5px] text-ink-3">
              Tu n'as aucune dette ni créance en cours avec les autres voyageurs.
            </p>
          </Card>
        ) : (
          <Card padding={0}>
            {data.map((p, i) => {
              const isOpen = expanded === p.user.id;
              const totalSign = p.byCurrency.reduce((acc, c) => acc + Math.sign(c.amount), 0);
              const onlyOwes = p.byCurrency.every((c) => c.amount < 0);
              const onlyReceives = p.byCurrency.every((c) => c.amount > 0);
              return (
                <div key={p.user.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : p.user.id)}
                    className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left hover:bg-bg"
                  >
                    <Avatar id={p.user.id} name={p.user.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold text-ink">{p.user.name}</div>
                      <div className="mt-0.5 text-[11.5px] font-medium text-ink-3">
                        {onlyOwes
                          ? 'Tu dois'
                          : onlyReceives
                          ? 'Te doit'
                          : 'Soldes croisés'}{' '}
                        · {p.trips.length} voyage{p.trips.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      {p.byCurrency.map((c) => (
                        <Money
                          key={c.currency}
                          value={c.amount}
                          size={14}
                          weight={700}
                          color={c.amount < 0 ? '#A0496B' : c.amount > 0 ? '#2F7A6A' : '#586F7C'}
                          sign={c.amount < 0 ? 'neg' : c.amount > 0 ? 'pos' : 'none'}
                          currency={currencySymbol(c.currency)}
                        />
                      ))}
                    </div>
                    <IcArrowR
                      size={14}
                      sw={2}
                      className={`text-ink-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {isOpen ? (
                    <div className="bg-bg px-3.5 py-2.5">
                      {p.trips.map((t) => (
                        <Link
                          key={`${t.tripId}-${t.currency}`}
                          href={`/trips/${t.tripId}/accounts`}
                          className="flex items-center justify-between rounded-card bg-surface px-3 py-2.5 shadow-card-sm mb-1.5 last:mb-0"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-ink truncate">{t.tripTitle}</div>
                            <div className="mt-0.5 text-[11px] font-medium text-ink-3">
                              {t.amount < 0 ? 'Tu lui dois' : 'Te doit'}
                            </div>
                          </div>
                          <Money
                            value={t.amount}
                            size={13}
                            weight={700}
                            color={t.amount < 0 ? '#A0496B' : '#2F7A6A'}
                            sign={t.amount < 0 ? 'neg' : 'pos'}
                            currency={currencySymbol(t.currency)}
                          />
                          <IcArrowR size={13} sw={2} className="ml-2 text-ink-3" />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {i < data.length - 1 && !isOpen ? <div className="ml-[64px] h-px bg-line" /> : null}
                </div>
              );
            })}
          </Card>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

