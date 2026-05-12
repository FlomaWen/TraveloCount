'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Card, CatBadge, Divider, Money, categoryToIcon } from '@/components/atoms';
import { IcArrowL, IcFilter, IcPlus } from '@/components/icons';
import { TabBar } from '@/components/tab-bar';
import { ExpenseFormModal } from '@/components/expense-form-modal';

interface Member {
  id: string;
  name: string;
}

interface TripDetail {
  id: string;
  title: string;
  currency: string;
  defaultSplitMethod: 'EQUAL' | 'SHARES' | 'EXACT';
  members: Member[];
}

interface Expense {
  id: string;
  label: string;
  category: 'TRANSPORT' | 'LODGING' | 'RESTAURANT' | 'ACTIVITY' | 'OTHER';
  amount: number;
  currency: string;
  amountOriginal: number | null;
  currencyOriginal: string | null;
  date: string;
  splitMethod: string;
  payer: { id: string; name: string };
  participantCount: number;
  myShare: number;
}

const FILTERS = ['Tout', 'Transport', 'Logement', 'Resto', 'Activités'] as const;
const FILTER_TO_CAT: Record<string, Expense['category'] | null> = {
  Tout: null,
  Transport: 'TRANSPORT',
  Logement: 'LODGING',
  Resto: 'RESTAURANT',
  Activités: 'ACTIVITY',
};

export default function ExpensesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Tout');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!session?.accessToken || !params?.id) return;
    try {
      const [t, e] = await Promise.all([
        apiFetch<TripDetail>(`/trips/${params.id}`),
        apiFetch<Expense[]>(`/trips/${params.id}/expenses`),
      ]);
      setTrip(t);
      setExpenses(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  useEffect(() => {
    load();
  }, [session?.accessToken, params?.id]);

  if (!trip) return <main className="p-6 text-sm text-ink-3">{error ?? 'Chargement…'}</main>;

  const filtered =
    filter === 'Tout'
      ? expenses
      : expenses.filter((e) => e.category === FILTER_TO_CAT[filter]);
  const grouped = groupByDay(filtered);
  const curr = currencySymbol(trip.currency);

  return (
    <main className="flex min-h-screen flex-col pb-24">
      {/* Compact header */}
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
          <h1 className="text-[16px] font-bold text-ink">Dépenses</h1>
        </div>
        <div className="w-9" />
      </header>

      <TabBar tripId={trip.id} active="expenses" />

      <div className="flex-1 px-4 pt-3.5">
        {/* Filters */}
        <div className="mb-3.5 flex items-center gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                f === filter
                  ? 'whitespace-nowrap rounded-pill bg-ink px-2.5 py-[5px] text-[12px] font-semibold text-white'
                  : 'whitespace-nowrap rounded-pill bg-[rgba(47,69,80,0.07)] px-2.5 py-[5px] text-[12px] font-semibold text-ink-2'
              }
            >
              {f}
            </button>
          ))}
          <div className="ml-auto inline-flex items-center gap-1 rounded-pill border border-line2 px-2.5 py-[5px] text-[12px] font-semibold text-ink-2">
            <IcFilter size={13} sw={2} /> Trier
          </div>
        </div>

        {/* Empty state */}
        {grouped.length === 0 ? (
          <Card className="text-center text-sm text-ink-3">
            Aucune dépense {filter !== 'Tout' ? `dans cette catégorie` : 'pour l\'instant'}
          </Card>
        ) : (
          grouped.map(([day, items]) => {
            const dayTotal = items.reduce((acc, e) => acc + e.amount, 0);
            return (
              <div key={day} className="mb-3.5">
                <div className="flex items-center justify-between px-1 pb-2 pt-1.5">
                  <div className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-ink">
                    {formatDay(day)}
                  </div>
                  <div className="text-[11.5px] font-semibold text-ink-3">
                    <Money value={dayTotal} size={11.5} weight={600} color="#586F7C" currency={curr} />
                  </div>
                </div>
                <Card padding={0}>
                  {items.map((exp, i) => (
                    <div key={exp.id}>
                      <ExpenseRow expense={exp} currency={curr} myId={session?.userId} />
                      {i < items.length - 1 ? <Divider inset={62} /> : null}
                    </div>
                  ))}
                </Card>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        aria-label="Nouvelle dépense"
        className="fixed bottom-6 left-1/2 z-30 inline-flex h-[58px] w-[58px] -translate-x-1/2 items-center justify-center rounded-full bg-ink text-white shadow-fab"
        style={{ marginLeft: 'calc((min(100vw, 430px) / 2) - 0px)' }}
      >
        <IcPlus size={26} sw={2.2} />
      </button>

      {showModal && session?.userId ? (
        <ExpenseFormModal
          tripId={trip.id}
          tripCurrency={trip.currency}
          defaultSplitMethod={trip.defaultSplitMethod}
          members={trip.members}
          currentUserId={session.userId}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      ) : null}
    </main>
  );
}

function ExpenseRow({
  expense,
  currency,
  myId,
}: {
  expense: Expense;
  currency: string;
  myId?: string;
}) {
  const isMe = expense.payer.id === myId;
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <CatBadge name={categoryToIcon(expense.category)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold leading-tight text-ink">
          {expense.label}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11.5px] font-medium text-ink-3">
          {isMe ? (
            <span className="font-semibold text-pos">Tu as payé</span>
          ) : (
            <>
              Payé par <span className="font-semibold text-ink-2">{expense.payer.name.split(' ')[0]}</span>
            </>
          )}
          <span className="text-mute">·</span>
          <span>÷ {expense.participantCount}</span>
        </div>
      </div>
      <div className="text-right">
        <Money value={expense.amount} size={14} weight={700} color="#0C1A22" currency={currency} />
        {expense.amountOriginal !== null && expense.currencyOriginal ? (
          <div className="mono text-[10px] text-ink-3">
            ≈ {expense.amountOriginal.toFixed(2).replace('.', ',')} {expense.currencyOriginal}
          </div>
        ) : null}
        <div
          className={`mono mt-0.5 text-[11px] font-semibold ${isMe ? 'text-pos' : 'text-neg'}`}
        >
          {isMe ? '+' : '−'}
          {Math.abs(expense.amount - expense.myShare).toFixed(2).replace('.', ',')}
          {currency}
        </div>
      </div>
    </div>
  );
}

function groupByDay(expenses: Expense[]): [string, Expense[]][] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const day = new Date(e.date).toISOString().slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(e);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function currencySymbol(code: string): string {
  return code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code;
}
