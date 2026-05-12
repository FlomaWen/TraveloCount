'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { Card, CatBadge, Divider } from '@/components/atoms';
import { IcMap, IcPlus } from '@/components/icons';
import { ItineraryFormModal, type ItineraryEditItem } from '@/components/itinerary-form-modal';
import { LoadingFallback, Skeleton, SkeletonCircle } from '@/components/skeleton';
import { useTrip } from '@/lib/trip-context';
import type { CatIconName } from '@/components/icons';

const TripMap = dynamic(() => import('@/components/trip-map').then((m) => m.TripMap), {
  ssr: false,
});

interface ItineraryItem {
  id: string;
  day: number;
  time: string | null;
  type: 'TRANSPORT' | 'LODGING' | 'ACTIVITY' | 'MEAL';
  title: string;
  details: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export default function ItineraryPage() {
  const { trip } = useTrip();
  const { data: session } = useSession();
  const [items, setItems] = useState<ItineraryItem[] | null>(null);
  const [activeDay, setActiveDay] = useState(trip.dayNumber ?? 1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ItineraryEditItem | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = trip.members.find((m) => m.id === session?.userId);
  const isAdmin = me?.role === 'ADMIN';

  const load = async () => {
    if (!session?.accessToken) return;
    try {
      const list = await apiFetch<ItineraryItem[]>(`/trips/${trip.id}/itinerary`);
      setItems(list);
      if (!trip.dayNumber && list[0]) setActiveDay(list[0].day);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  useEffect(() => {
    load();
  }, [session?.accessToken, trip.id]);

  const safeItems = items ?? [];
  const totalDays = trip.totalDays ?? Math.max(...safeItems.map((i) => i.day), 1);
  const activeDayItems = safeItems
    .filter((i) => i.day === activeDay)
    .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
  const mapPoints = activeDayItems
    .filter((i) => i.lat !== null && i.lng !== null)
    .map((i) => ({ id: i.id, lat: i.lat!, lng: i.lng!, title: i.title, time: i.time }));

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-ink-3">
          Itinéraire
        </div>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-semibold ${
            showMap ? 'bg-ink text-white' : 'border border-line2 text-ink-2'
          }`}
        >
          <IcMap size={13} sw={1.9} /> Carte
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
          const active = d === activeDay;
          const dayItems = safeItems.filter((it) => it.day === d);
          const date = dateForDay(trip.startDate, d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDay(d)}
              className={`flex h-16 min-w-[52px] flex-col items-center justify-center rounded-[14px] border ${
                active ? 'border-ink bg-ink text-white' : 'border-line2 bg-surface text-ink'
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${
                  active ? 'text-white/70' : 'text-ink-3'
                }`}
              >
                J{d}
              </div>
              <div className="mt-0.5 text-[16px] font-bold">{date ? date.getDate() : '—'}</div>
              <div className={`text-[9.5px] font-semibold ${active ? 'text-white/60' : 'text-mute'}`}>
                {dayItems.length > 0 ? `${dayItems.length} étape${dayItems.length > 1 ? 's' : ''}` : ''}
              </div>
            </button>
          );
        })}
      </div>

      {showMap ? (
        <div className="mb-4 mt-2">
          <TripMap points={mapPoints} />
          {mapPoints.length === 0 ? (
            <p className="mt-2 text-[12px] text-ink-3">
              Ajoute des étapes avec une adresse pour les voir sur la carte.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mb-2 text-sm text-neg">{error}</p> : null}

      {items === null ? (
        <LoadingFallback
          onRetry={load}
          skeleton={
            <Card padding={0} className="mt-3">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div className="flex items-start gap-3 px-3.5 py-3">
                    <div className="w-12 flex-shrink-0 pt-0.5">
                      <Skeleton width={36} height={12} radius={3} />
                    </div>
                    <SkeletonCircle size={32} />
                    <div className="min-w-0 flex-1 pb-1.5">
                      <Skeleton width="70%" height={13} radius={3} />
                      <div className="mt-1">
                        <Skeleton width="50%" height={11} radius={3} />
                      </div>
                    </div>
                  </div>
                  {i < 2 ? <Divider inset={72} /> : null}
                </div>
              ))}
            </Card>
          }
        />
      ) : activeDayItems.length === 0 ? (
        <Card className="mt-3 text-center text-sm text-ink-3">
          Aucune étape pour ce jour. Ajoute-en une avec le bouton +.
        </Card>
      ) : (
        <Card padding={0} className="mt-3">
          {activeDayItems.map((it, i) => {
            const inner = (
              <>
                <div className="w-12 flex-shrink-0 pt-0.5">
                  <div className="mono text-[12px] font-bold text-ink">{it.time ?? '—'}</div>
                </div>
                <div className="flex flex-col items-center self-stretch flex-shrink-0">
                  <CatBadge name={typeToIcon(it.type)} size={32} />
                  {i < activeDayItems.length - 1 ? (
                    <div className="w-0.5 flex-1 min-h-[14px] bg-line mt-1.5" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pb-1.5 text-left">
                  <div className="text-[13.5px] font-semibold leading-tight text-ink">
                    {it.title}
                  </div>
                  {it.details ? (
                    <div className="mt-0.5 text-[11.5px] font-medium text-ink-3">{it.details}</div>
                  ) : null}
                  {it.address ? (
                    <div className="mt-0.5 text-[11px] text-mute">📍 {it.address}</div>
                  ) : null}
                </div>
              </>
            );
            return (
              <div key={it.id}>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        id: it.id,
                        day: it.day,
                        time: it.time,
                        type: it.type,
                        title: it.title,
                        details: it.details,
                        address: it.address,
                        lat: it.lat,
                        lng: it.lng,
                      })
                    }
                    className="flex w-full items-start gap-3 px-3.5 py-3 text-left hover:bg-bg"
                  >
                    {inner}
                  </button>
                ) : (
                  <div className="flex items-start gap-3 px-3.5 py-3">{inner}</div>
                )}
                {i < activeDayItems.length - 1 ? <Divider inset={72} /> : null}
              </div>
            );
          })}
        </Card>
      )}

      <button
        type="button"
        onClick={() => setShowModal(true)}
        aria-label="Nouvelle étape"
        className="fixed bottom-6 left-1/2 z-30 inline-flex h-[58px] w-[58px] -translate-x-1/2 items-center justify-center rounded-full bg-ink text-white shadow-fab"
      >
        <IcPlus size={26} sw={2.2} />
      </button>

      {showModal ? (
        <ItineraryFormModal
          tripId={trip.id}
          totalDays={trip.totalDays}
          defaultDay={activeDay}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      ) : null}

      {editing ? (
        <ItineraryFormModal
          tripId={trip.id}
          totalDays={trip.totalDays}
          defaultDay={activeDay}
          item={editing}
          canDelete={isAdmin}
          onClose={() => setEditing(null)}
          onCreated={() => {
            setEditing(null);
            load();
          }}
          onDeleted={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

function typeToIcon(type: ItineraryItem['type']): CatIconName {
  switch (type) {
    case 'TRANSPORT':
      return 'car';
    case 'LODGING':
      return 'bed';
    case 'MEAL':
      return 'fork';
    case 'ACTIVITY':
    default:
      return 'ticket';
  }
}

function dateForDay(start: string | null, day: number): Date | null {
  if (!start) return null;
  const d = new Date(start);
  d.setDate(d.getDate() + day - 1);
  return d;
}
