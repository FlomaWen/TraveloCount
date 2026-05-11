'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Avatar, Card, Money } from '@/components/atoms';
import { BottomNav } from '@/components/bottom-nav';
import { IcArrowL, IcFilter, IcReceipt, IcMap, IcSparkle, IcUsers } from '@/components/icons';

type ActivityType =
  | 'TRIP_CREATED'
  | 'MEMBER_JOINED'
  | 'EXPENSE_ADDED'
  | 'EXPENSE_SETTLED'
  | 'ITINERARY_ADDED'
  | 'DOCUMENT_UPLOADED'
  | 'MESSAGE_POSTED';

interface ActivityEvent {
  id: string;
  type: ActivityType;
  payload: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string };
  trip: { id: string; title: string };
}

export default function ActivityPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    let cancelled = false;
    const load = () =>
      apiFetch<ActivityEvent[]>('/activity?limit=50')
        .then((d) => {
          if (!cancelled) setEvents(d);
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur');
        });
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [session?.accessToken]);

  return (
    <main className="min-h-screen pb-24">
      <header className="flex items-center justify-between px-5 pt-3">
        <div>
          <div className="label-up">Fil d'activité</div>
          <h1 className="mt-0.5 text-h1-screen text-ink">Activité</h1>
        </div>
        <button
          type="button"
          aria-label="Filtrer"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-btn border border-line2 bg-surface text-ink"
        >
          <IcFilter size={18} sw={1.8} />
        </button>
      </header>

      <div className="px-4 pt-4">
        {error ? <p className="text-sm text-neg">{error}</p> : null}

        {!events ? (
          <p className="text-sm text-ink-3">Chargement…</p>
        ) : events.length === 0 ? (
          <Card className="text-center text-sm text-ink-3">
            Pas d'activité récente. Crée un voyage ou ajoute une dépense pour démarrer.
          </Card>
        ) : (
          <Card padding={0}>
            {events.map((e, i) => (
              <div key={e.id}>
                <Link
                  href={`/trips/${e.trip.id}`}
                  className="flex items-start gap-3 px-3.5 py-3 hover:bg-bg"
                >
                  <Avatar id={e.user.id} name={e.user.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] leading-tight text-ink">
                      <strong>{e.user.name.split(' ')[0]}</strong>{' '}
                      <span className="text-ink-2">{describe(e)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-3">
                      <span>{relativeTime(e.createdAt)}</span>
                      <span className="text-mute">·</span>
                      <span className="font-medium">{e.trip.title}</span>
                    </div>
                  </div>
                  <ActivityRightAccessory event={e} />
                </Link>
                {i < events.length - 1 ? <div className="ml-[64px] h-px bg-line" /> : null}
              </div>
            ))}
          </Card>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function describe(e: ActivityEvent): string {
  switch (e.type) {
    case 'TRIP_CREATED':
      return `a créé le voyage`;
    case 'MEMBER_JOINED':
      return `a rejoint le voyage`;
    case 'EXPENSE_ADDED':
      return `a ajouté ${(e.payload.label as string) ?? 'une dépense'}`;
    case 'EXPENSE_SETTLED':
      return `a réglé un compte`;
    case 'ITINERARY_ADDED':
      return `a ajouté ${(e.payload.title as string) ?? 'une étape'}`;
    case 'DOCUMENT_UPLOADED':
      return `a uploadé ${(e.payload.filename as string) ?? 'un document'}`;
    case 'MESSAGE_POSTED':
      return `a posté un message`;
    default:
      return '';
  }
}

function ActivityRightAccessory({ event }: { event: ActivityEvent }) {
  if (event.type === 'EXPENSE_ADDED' && typeof event.payload.amount === 'number') {
    const currency = (event.payload.currency as string) ?? 'EUR';
    return (
      <Money
        value={event.payload.amount}
        size={13}
        weight={700}
        color="#0C1A22"
        currency={currency === 'EUR' ? '€' : currency}
      />
    );
  }
  if (event.type === 'ITINERARY_ADDED') {
    return <IcMap size={18} sw={1.8} className="text-ink-3" />;
  }
  if (event.type === 'DOCUMENT_UPLOADED') {
    return <IcReceipt size={18} sw={1.8} className="text-ink-3" />;
  }
  if (event.type === 'MEMBER_JOINED') {
    return <IcUsers size={18} sw={1.8} className="text-ink-3" />;
  }
  if (event.type === 'TRIP_CREATED') {
    return <IcSparkle size={18} sw={1.8} className="text-accent" />;
  }
  return null;
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
