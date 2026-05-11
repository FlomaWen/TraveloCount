'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Avatar, Card, Chip, Divider, Money } from '@/components/atoms';
import { IcArrowL, IcArrowR, IcSwap } from '@/components/icons';
import { TabBar } from '@/components/tab-bar';

interface UserRef {
  id: string;
  name: string;
}

interface BalancesResponse {
  currency: string;
  balances: { user: UserRef; amount: number }[];
  settlements: { from: UserRef; to: UserRef; amount: number }[];
}

interface TripRef {
  id: string;
  title: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [data, setData] = useState<BalancesResponse | null>(null);
  const [trip, setTrip] = useState<TripRef | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken || !params?.id) return;
    apiFetch<TripRef>(`/trips/${params.id}`)
      .then(setTrip)
      .catch(() => undefined);
    apiFetch<BalancesResponse>(`/trips/${params.id}/balances`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, [session?.accessToken, params?.id]);

  if (!data || !trip)
    return <main className="p-6 text-sm text-ink-3">{error ?? 'Chargement…'}</main>;

  const curr = currencySymbol(data.currency);
  const maxAbs = Math.max(...data.balances.map((b) => Math.abs(b.amount)), 1);
  const sorted = [...data.balances].sort((a, b) => a.amount - b.amount);
  const allZero = data.balances.every((b) => Math.abs(b.amount) < 0.005);

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
        <div className="text-center">
          <div className="label-up">{trip.title}</div>
          <h1 className="text-[16px] font-bold text-ink">Comptes</h1>
        </div>
        <div className="w-9" />
      </header>

      <TabBar tripId={trip.id} active="balance" />

      <div className="flex flex-col gap-3 p-4">
        {allZero ? (
          <Card className="!bg-accent">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-ink/15 text-accent-ink">
                💡
              </span>
              <div className="flex-1 text-[12.5px] text-accent-ink">
                <p className="font-bold">Pas encore de dette à régler</p>
                <p className="mt-1 leading-[1.4]">
                  Les soldes sont à 0€. Vérifie qu'en ajoutant une dépense, tu coches bien <b>tous les
                  membres qui partagent</b> (pas juste le payeur) dans la section "Partager entre".
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Position par personne */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14px] font-bold text-ink">Position par personne</div>
            <Chip tone="ghost" size="sm">{data.currency}</Chip>
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

        {/* Remboursements optimisés */}
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
          <button type="button" className="btn-primary mt-2 w-full">
            <IcSwap size={17} sw={2} /> Marquer mes paiements comme effectués
          </button>
        ) : null}
      </div>
    </main>
  );
}

function currencySymbol(code: string): string {
  return code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code;
}
