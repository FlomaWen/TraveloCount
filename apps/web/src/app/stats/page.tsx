'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Avatar, Card, Chip, Money } from '@/components/atoms';
import { BottomNav } from '@/components/bottom-nav';
import { IcSparkle } from '@/components/icons';

type Category = 'TRANSPORT' | 'LODGING' | 'RESTAURANT' | 'ACTIVITY' | 'OTHER';

const CAT_COLOR: Record<Category, string> = {
  TRANSPORT: '#B8DBD9',
  LODGING: '#2F4550',
  RESTAURANT: '#586F7C',
  ACTIVITY: '#0C1A22',
  OTHER: '#9CC9C5',
};

const CAT_LABEL: Record<Category, string> = {
  TRANSPORT: 'Transport',
  LODGING: 'Logement',
  RESTAURANT: 'Resto',
  ACTIVITY: 'Activités',
  OTHER: 'Autre',
};

interface Trip {
  id: string;
  title: string;
  currency: string;
  totalSpent: number;
  budget: number | null;
}

interface TripStats {
  tripTitle: string;
  currency: string;
  total: number;
  budget: number | null;
  categories: { category: Category; value: number }[];
  daily: { date: string; value: number }[];
  topPayer: { userId: string; name: string; advanced: number } | null;
  avg: number;
  expenseCount: number;
}

export default function StatsPage() {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [scope, setScope] = useState<string>('');
  const [stats, setStats] = useState<TripStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiFetch<Trip[]>('/trips')
      .then((t) => {
        setTrips(t);
        if (t[0] && !scope) setScope(t[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken || !scope) return;
    apiFetch<TripStats>(`/trips/${scope}/stats`)
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur stats'));
  }, [session?.accessToken, scope]);

  const currency = stats ? currencySymbol(stats.currency) : '€';
  const total = stats?.total ?? 0;
  const budgetPct = stats?.budget && stats.budget > 0 ? Math.round((total / stats.budget) * 100) : null;
  const dailyMax = stats ? Math.max(...stats.daily.map((d) => d.value), 1) : 1;

  return (
    <main className="min-h-screen pb-24">
      <header className="flex items-center justify-between px-5 pt-3">
        <div>
          <div className="label-up">Insights</div>
          <h1 className="mt-0.5 text-h1-screen text-ink">Stats</h1>
        </div>
      </header>

      {/* Scope chips */}
      <div className="px-4 pt-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-1.5">
          {trips.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setScope(t.id)}
              className={`whitespace-nowrap rounded-pill px-2.5 py-[5px] text-[12px] font-semibold ${
                scope === t.id ? 'bg-ink text-white' : 'border border-line2 text-ink-3'
              }`}
            >
              {t.title}
            </button>
          ))}
          {trips.length === 0 && !error ? (
            <span className="text-[12px] text-ink-3">Crée un voyage pour voir tes stats</span>
          ) : null}
        </div>
      </div>

      {error ? <p className="px-5 text-sm text-neg">{error}</p> : null}

      {!stats || stats.expenseCount === 0 ? (
        <div className="px-4 pt-4">
          <Card className="text-center text-[13px] text-ink-3">
            {stats?.expenseCount === 0
              ? 'Pas encore de dépenses pour ce voyage.'
              : 'Chargement…'}
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {/* Donut */}
          <Card>
            <div className="mb-3.5 flex items-center justify-between">
              <div className="text-[14px] font-bold text-ink">Répartition par catégorie</div>
              <Chip tone="ghost" size="sm">{stats.tripTitle}</Chip>
            </div>
            <div className="flex items-center gap-4.5" style={{ gap: 18 }}>
              <CategoryDonut categories={stats.categories} total={total} currency={currency} />
              <div className="flex flex-1 flex-col gap-2">
                {stats.categories.map((c) => (
                  <div key={c.category} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px]"
                      style={{ background: CAT_COLOR[c.category] }}
                    />
                    <span className="flex-1 text-[12px] font-semibold text-ink-2">
                      {CAT_LABEL[c.category]}
                    </span>
                    <span className="mono text-[11.5px] font-semibold text-ink-3">
                      {Math.round((c.value / total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Daily bars */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-bold text-ink">Dépenses par jour</div>
              <Chip tone="dark" size="sm">{stats.daily.length} j</Chip>
            </div>
            <div className="mt-4 flex items-end gap-2" style={{ height: 130 }}>
              {stats.daily.slice(-10).map((d, i, arr) => {
                const h = (d.value / dailyMax) * 110;
                const isLast = i === arr.length - 1;
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="mono text-[9.5px] font-semibold text-ink-3">
                      {d.value > 0 ? Math.round(d.value) : '·'}
                    </div>
                    <div className="relative w-full" style={{ height: Math.max(h, 4) }}>
                      <div
                        className="absolute inset-0 rounded-[8px]"
                        style={{
                          background: isLast ? '#0C1A22' : d.value > 0 ? '#B8DBD9' : '#F4F4F9',
                        }}
                      />
                      {isLast ? (
                        <div
                          className="absolute -top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                          style={{ background: '#B8DBD9' }}
                        />
                      ) : null}
                    </div>
                    <div
                      className={`text-[10.5px] ${
                        isLast ? 'font-bold text-ink' : 'font-semibold text-ink-3'
                      }`}
                    >
                      {dayLabel(d.date)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <Card padding={14}>
              <div className="label-up">Dépense moyenne</div>
              <div className="mt-1.5">
                <Money value={stats.avg} size={17} weight={700} currency={currency} />
              </div>
              <div className="mt-1 text-[11px] font-semibold text-ink-3">
                sur {stats.expenseCount} dépense{stats.expenseCount > 1 ? 's' : ''}
              </div>
            </Card>
            <Card padding={14}>
              <div className="label-up">Plus gros payeur</div>
              {stats.topPayer ? (
                <>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Avatar
                      id={stats.topPayer.userId}
                      name={stats.topPayer.name}
                      size={26}
                    />
                    <span className="truncate text-[14px] font-bold text-ink">
                      {stats.topPayer.name.split(' ')[0]}
                    </span>
                  </div>
                  <div className="mono mt-1 text-[12px] font-semibold text-ink-3">
                    {stats.topPayer.advanced.toLocaleString('fr-FR')}{currency} avancés
                  </div>
                </>
              ) : (
                <div className="mt-1 text-[12px] text-ink-3">—</div>
              )}
            </Card>
          </div>

          {/* Budget tip */}
          {stats.budget !== null && budgetPct !== null ? (
            <Card className="!bg-accent">
              <div className="flex items-start gap-2.5">
                <IcSparkle size={20} sw={1.9} className="flex-shrink-0" style={{ color: '#1F3E3A' }} />
                <div>
                  <div className="text-[13px] font-bold" style={{ color: '#1F3E3A' }}>
                    Tu es à {budgetPct}% du budget
                  </div>
                  <p className="mt-0.5 text-[12px] leading-[1.4] opacity-85" style={{ color: '#1F3E3A' }}>
                    {budgetPct < 80
                      ? 'Tout est sous contrôle.'
                      : budgetPct < 100
                        ? `Plus que ${(stats.budget - total).toFixed(0)}${currency} pour rester dans le budget.`
                        : `Dépassement de ${(total - stats.budget).toFixed(0)}${currency}. Pense à ajuster la fin du voyage.`}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function CategoryDonut({
  categories,
  total,
  currency,
}: {
  categories: { category: Category; value: number }[];
  total: number;
  currency: string;
}) {
  const r = 46;
  const C = 2 * Math.PI * r;
  let cumPct = 0;
  return (
    <div className="relative">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F4F4F9" strokeWidth="22" />
        {categories.map((c) => {
          const pct = total > 0 ? c.value / total : 0;
          const dash = pct * C;
          const off = -cumPct * C;
          cumPct += pct;
          return (
            <circle
              key={c.category}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={CAT_COLOR[c.category]}
              strokeWidth="22"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={off}
              transform="rotate(-90 60 60)"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="mono text-[18px] font-bold text-ink">
          {Math.round(total)}
          {currency}
        </div>
        <div className="label-up !text-[9.5px]">Total</div>
      </div>
    </div>
  );
}

function dayLabel(iso: string): string {
  return new Date(iso).getDate().toString();
}

function currencySymbol(code: string): string {
  return code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code;
}
