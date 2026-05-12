'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Avatar, Card, Chip, Divider, Money } from '@/components/atoms';
import { IcArrowR, IcSwap } from '@/components/icons';
import { LoadingFallback, Skeleton, SkeletonCircle } from '@/components/skeleton';
import { useTrip } from '@/lib/trip-context';

interface UserRef {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface BalancesResponse {
  currency: string;
  balances: { user: UserRef; amount: number }[];
  settlements: { from: UserRef; to: UserRef; amount: number }[];
}

type SettlementStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

interface SettlementRecord {
  id: string;
  from: UserRef;
  to: UserRef;
  amount: number;
  currency: string;
  status: SettlementStatus;
  createdAt: string;
}

export default function AccountsPage() {
  const { trip } = useTrip();
  const { data: session } = useSession();
  const [data, setData] = useState<BalancesResponse | null>(null);
  const [settlementsHistory, setSettlementsHistory] = useState<SettlementRecord[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!session?.accessToken) return;
    apiFetch<BalancesResponse>(`/trips/${trip.id}/balances`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
    apiFetch<SettlementRecord[]>(`/trips/${trip.id}/settlements`)
      .then(setSettlementsHistory)
      .catch(() => undefined);
  };

  useEffect(load, [session?.accessToken, trip.id]);

  const markMineAsSent = async () => {
    if (busy) return;
    setBusy('mark-sent');
    setError(null);
    try {
      await apiFetch(`/trips/${trip.id}/settlements/mark-mine-sent`, { method: 'POST' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(null);
    }
  };

  const actOnSettlement = async (id: string, action: 'confirm' | 'reject' | 'cancel') => {
    setBusy(id);
    setError(null);
    try {
      if (action === 'cancel') {
        await apiFetch(`/trips/${trip.id}/settlements/${id}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/trips/${trip.id}/settlements/${id}/${action}`, { method: 'PATCH' });
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(null);
    }
  };

  const pending = settlementsHistory.filter((s) => s.status === 'PENDING');
  const myPendingSent = pending.filter((s) => s.from.id === session?.userId);
  const myPendingRecv = pending.filter((s) => s.to.id === session?.userId);

  if (error)
    return <div className="p-6 text-sm text-neg">{error}</div>;

  if (!data) {
    return (
      <LoadingFallback
        onRetry={load}
        skeleton={
          <div className="flex flex-col gap-3 p-4 pb-12">
            <div className="rounded-card bg-surface p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <Skeleton width={140} height={14} radius={4} />
                <Skeleton width={42} height={18} radius={999} />
              </div>
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <SkeletonCircle size={28} />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <Skeleton width="40%" height={12} radius={3} />
                        <Skeleton width={50} height={12} radius={3} />
                      </div>
                      <div className="mt-1.5">
                        <Skeleton width="100%" height={6} radius={999} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-1 pt-1">
              <Skeleton width={180} height={14} radius={4} />
              <Skeleton width={60} height={18} radius={999} />
            </div>
            <div className="rounded-card bg-surface p-0 shadow-card">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-3">
                  <SkeletonCircle size={32} />
                  <Skeleton width={12} height={12} radius={2} />
                  <SkeletonCircle size={32} />
                  <div className="flex-1">
                    <Skeleton width="60%" height={12} radius={3} />
                    <div className="mt-1">
                      <Skeleton width="40%" height={10} radius={3} />
                    </div>
                  </div>
                  <Skeleton width={60} height={14} radius={4} />
                </div>
              ))}
            </div>
          </div>
        }
      />
    );
  }

  const curr = currencySymbol(data.currency);
  const maxAbs = Math.max(...data.balances.map((b) => Math.abs(b.amount)), 1);
  const sorted = [...data.balances].sort((a, b) => a.amount - b.amount);
  const allZero = data.balances.every((b) => Math.abs(b.amount) < 0.005);

  return (
    <div className="flex flex-col gap-3 p-4 pb-12">
      {allZero ? (
        <Card className="!bg-accent">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-ink/15 text-accent-ink">
              💡
            </span>
            <div className="flex-1 text-[12.5px] text-accent-ink">
              <p className="font-bold">Pas encore de dette à régler</p>
              <p className="mt-1 leading-[1.4]">
                Les soldes sont à 0€. Vérifie qu'en ajoutant une dépense, tu coches bien{' '}
                <b>tous les membres qui partagent</b> (pas juste le payeur) dans la section "Partager entre".
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[14px] font-bold text-ink">Position par personne</div>
          <Chip tone="ghost" size="sm">
            {data.currency}
          </Chip>
        </div>
        <div className="flex flex-col gap-2.5">
          {sorted.map((b) => {
            const pct = (Math.abs(b.amount) / maxAbs) * 100;
            const pos = b.amount >= 0;
            return (
              <div key={b.user.id} className="flex items-center gap-2.5">
                <Avatar id={b.user.id} name={b.user.name} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px] font-bold text-ink">
                      {b.user.name}
                      {b.user.id === session?.userId ? (
                        <span className="font-normal text-ink-3"> · toi</span>
                      ) : null}
                    </span>
                    <Money
                      value={b.amount}
                      size={12.5}
                      weight={700}
                      color={pos ? '#2F7A6A' : '#A0496B'}
                      sign={pos ? 'pos' : 'neg'}
                      currency={curr}
                    />
                  </div>
                  <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-pill bg-bg">
                    <div
                      className="absolute top-0 bottom-0 rounded-pill"
                      style={{
                        width: `${pct / 2}%`,
                        left: pos ? '50%' : `${50 - pct / 2}%`,
                        background: pos ? '#2F7A6A' : '#A0496B',
                      }}
                    />
                    <div className="absolute -top-0.5 -bottom-0.5 left-1/2 w-px bg-line2" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between px-1 pt-1">
        <div className="text-[14px] font-bold text-ink">Remboursements optimisés</div>
        <Chip tone="accent" size="sm">
          {data.settlements.length} transfert{data.settlements.length > 1 ? 's' : ''}
        </Chip>
      </div>

      {data.settlements.length === 0 ? (
        <Card className="text-center">
          <div className="text-[14px] font-bold text-pos">✓ Tout est équilibré</div>
          <div className="mt-1 text-[12.5px] text-ink-3">Aucun virement nécessaire</div>
        </Card>
      ) : (
        <Card padding={0}>
          {data.settlements.map((s, i) => {
            const isMine = s.from.id === session?.userId;
            return (
              <div key={i}>
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <Avatar id={s.from.id} name={s.from.name} size={32} />
                  <IcArrowR size={16} sw={2.2} className="text-ink-3" />
                  <Avatar id={s.to.id} name={s.to.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-ink">
                      {isMine ? 'Tu' : s.from.name.split(' ')[0]} → {s.to.name.split(' ')[0]}
                    </div>
                    <div className="mt-0.5 text-[11.5px] font-medium text-ink-3">
                      {isMine ? 'Virement à effectuer' : 'En attente'}
                    </div>
                  </div>
                  <Money
                    value={s.amount}
                    size={14}
                    weight={700}
                    color={isMine ? '#A0496B' : '#2F4550'}
                    currency={curr}
                  />
                </div>
                {i < data.settlements.length - 1 ? <Divider inset={64} /> : null}
              </div>
            );
          })}
        </Card>
      )}

      {data.settlements.some((s) => s.from.id === session?.userId) ? (
        <button
          type="button"
          onClick={markMineAsSent}
          disabled={busy === 'mark-sent'}
          className="btn-primary mt-2 w-full disabled:opacity-50"
        >
          <IcSwap size={17} sw={2} />
          {busy === 'mark-sent' ? 'Envoi…' : 'Marquer mes paiements comme effectués'}
        </button>
      ) : null}

      {myPendingSent.length > 0 ? (
        <>
          <div className="flex items-center justify-between px-1 pt-3">
            <div className="text-[14px] font-bold text-ink">En attente de confirmation</div>
            <Chip tone="ghost" size="sm">{myPendingSent.length}</Chip>
          </div>
          <Card padding={0}>
            {myPendingSent.map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <Avatar id={s.to.id} name={s.to.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-ink">
                      → {s.to.name.split(' ')[0]}
                    </div>
                    <div className="mt-0.5 text-[11.5px] font-medium text-ink-3">
                      Envoyé · attend confirmation
                    </div>
                  </div>
                  <Money
                    value={s.amount}
                    size={13.5}
                    weight={700}
                    color="#586F7C"
                    currency={currencySymbol(s.currency)}
                  />
                  <button
                    type="button"
                    onClick={() => actOnSettlement(s.id, 'cancel')}
                    disabled={busy === s.id}
                    className="ml-2 rounded-pill border border-line2 px-2.5 py-1 text-[11px] font-semibold text-ink-3 disabled:opacity-50"
                  >
                    {busy === s.id ? '…' : 'Annuler'}
                  </button>
                </div>
                {i < myPendingSent.length - 1 ? <Divider inset={62} /> : null}
              </div>
            ))}
          </Card>
        </>
      ) : null}

      {myPendingRecv.length > 0 ? (
        <>
          <div className="flex items-center justify-between px-1 pt-3">
            <div className="text-[14px] font-bold text-ink">Virements reçus à confirmer</div>
            <Chip tone="accent" size="sm">{myPendingRecv.length}</Chip>
          </div>
          <Card padding={0}>
            {myPendingRecv.map((s, i) => (
              <div key={s.id}>
                <div className="flex flex-col gap-2 px-3.5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar id={s.from.id} name={s.from.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ink">
                        {s.from.name.split(' ')[0]} dit t'avoir envoyé
                      </div>
                      <div className="mt-0.5 text-[11.5px] font-medium text-ink-3">
                        {relativeTime(s.createdAt)}
                      </div>
                    </div>
                    <Money
                      value={s.amount}
                      size={14}
                      weight={700}
                      color="#2F7A6A"
                      sign="pos"
                      currency={currencySymbol(s.currency)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => actOnSettlement(s.id, 'confirm')}
                      disabled={busy === s.id}
                      className="flex-1 rounded-input bg-pos px-3 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"
                    >
                      ✓ J'ai bien reçu
                    </button>
                    <button
                      type="button"
                      onClick={() => actOnSettlement(s.id, 'reject')}
                      disabled={busy === s.id}
                      className="rounded-input border border-line2 px-3 py-2 text-[12.5px] font-semibold text-neg disabled:opacity-50"
                    >
                      Pas reçu
                    </button>
                  </div>
                </div>
                {i < myPendingRecv.length - 1 ? <div className="h-px bg-line" /> : null}
              </div>
            ))}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function currencySymbol(code: string): string {
  return code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code;
}
