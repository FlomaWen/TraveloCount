'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Avatar, Card, Chip, Money } from '@/components/atoms';
import { IcArrowR, IcReceipt, IcSparkle, IcSwap } from '@/components/icons';
import { useTrip } from '@/lib/trip-context';

interface Settlement {
  from: { id: string; name: string };
  to: { id: string; name: string };
  amount: number;
}

export default function TripDetailPage() {
  const { trip } = useTrip();
  const { data: session } = useSession();
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiFetch<{ settlements: Settlement[] }>(`/trips/${trip.id}/balances`)
      .then((r) => setSettlements(r.settlements))
      .catch(() => undefined);
  }, [session?.accessToken, trip.id]);

  const myOutgoingSettlements = settlements.filter((s) => s.from.id === session?.userId);
  const budgetPct = trip.budget && trip.budget > 0 ? trip.totalSpent / trip.budget : 0;
  const overBudget = budgetPct > 1;

  return (
    <div className="flex flex-col gap-3 p-4 pb-8">
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
              {trip.userBalance < 0
                ? 'à reverser au groupe'
                : trip.userBalance > 0
                ? 'à recevoir'
                : 'à l\'équilibre'}
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
                  <Money
                    value={s.amount}
                    size={13}
                    weight={700}
                    color="#A0496B"
                    currency={currency(trip.currency)}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      {trip.budget !== null ? (
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="label-up">Budget · {Math.round(budgetPct * 100)}% utilisé</div>
              <div className="mt-1.5">
                <Money
                  value={trip.totalSpent}
                  size={20}
                  weight={700}
                  color="#0C1A22"
                  currency={currency(trip.currency)}
                />
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

      {trip.destination ? (
        <Card>
          <div className="label-up">Destination</div>
          <p className="mt-1 text-[14px] font-bold text-ink">{trip.destination}</p>
        </Card>
      ) : null}

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
  );
}

function currency(code: string): string {
  return code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code;
}
