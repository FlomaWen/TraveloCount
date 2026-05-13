import Link from 'next/link';
import { Money, AvatarStack, Chip, coverFromId, DotGridOverlay, SkylineOverlay } from './atoms';
import { IcWallet } from './icons';
import { env } from '@/lib/env';

interface Member {
  id: string;
  name: string;
}

interface BaseTrip {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  currency: string;
  budget: number | null;
  totalSpent: number;
  userBalance: number;
  status: 'IN_PROGRESS' | 'UPCOMING' | 'PAST' | 'UNDATED';
  hasCover?: boolean;
  members: Member[];
}

function coverImage(tripId: string): string {
  return `${env.apiUrl}/api/trips/${tripId}/cover`;
}

function formatDates(start: string | Date | null, end: string | Date | null): string {
  if (!start || !end) return 'Dates à définir';
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt(s)} → ${fmt(e)} ${e.getFullYear()}`;
}

function tripDays(start: string | Date | null, end: string | Date | null): { current: number; total: number } | null {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const endDate = new Date(end);
  endDate.setUTCHours(23, 59, 59, 999);
  const e = endDate.getTime();
  const now = Date.now();
  const total = Math.floor((e - s) / (24 * 3600 * 1000)) + 1;
  if (now < s || now > e) return null;
  const current = Math.floor((now - s) / (24 * 3600 * 1000)) + 1;
  return { current, total };
}

export function TripCardLarge({ trip }: { trip: BaseTrip & { dayNumber?: number | null; totalDays?: number | null } }) {
  const pct = trip.budget && trip.budget > 0 ? Math.min(1, trip.totalSpent / trip.budget) : 0;
  const days = trip.dayNumber && trip.totalDays
    ? { current: trip.dayNumber, total: trip.totalDays }
    : tripDays(trip.startDate, trip.endDate);
  const cover = coverFromId(trip.id);
  const isInProgress = trip.status === 'IN_PROGRESS';
  return (
    <article className="relative overflow-hidden rounded-card-lg bg-surface shadow-card-lg">
      <Link
        href={`/trips/${trip.id}`}
        aria-label={`Voir ${trip.title}`}
        className="absolute inset-0 z-0"
      />
      {/* Cover */}
      <div
        className="pointer-events-none relative h-32 overflow-hidden"
        style={trip.hasCover ? undefined : { background: cover }}
      >
        {trip.hasCover ? (
          <img
            src={coverImage(trip.id)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <DotGridOverlay opacity={0.18} />
            <SkylineOverlay />
          </>
        )}
        {trip.hasCover ? <div className="absolute inset-0 bg-black/15" /> : null}
        <div className="absolute left-3.5 top-3 flex gap-1.5">
          {isInProgress && days ? (
            <Chip tone="dark" size="sm">● EN COURS · J{days.current}/{days.total}</Chip>
          ) : trip.status === 'UPCOMING' ? (
            <Chip tone="dark" size="sm">À VENIR</Chip>
          ) : trip.status === 'PAST' ? (
            <Chip tone="dark" size="sm">PASSÉ</Chip>
          ) : (
            <Chip tone="dark" size="sm">DATES À DÉFINIR</Chip>
          )}
        </div>
        <div className="absolute right-3.5 top-3 flex items-center gap-1.5">
          <AvatarStack members={trip.members} size={26} />
        </div>
        {trip.destination ? (
          <div className="absolute bottom-3.5 left-4 mono text-[10px] tracking-[0.16em] text-white/70">
            {trip.destination.toUpperCase()}
          </div>
        ) : null}
        <Link
          href={`/trips/${trip.id}/accounts`}
          aria-label="Voir les comptes"
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute bottom-3 right-3 z-10 inline-flex h-[34px] w-[34px] items-center justify-center rounded-btn bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
        >
          <IcWallet size={16} sw={1.8} />
        </Link>
      </div>
      {/* Body */}
      <div className="pointer-events-none relative z-[1] p-[14px_18px_16px]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-h2-card text-ink">{trip.title}</div>
            <div className="mt-0.5 text-xs font-medium text-ink-3">
              {formatDates(trip.startDate, trip.endDate)}
            </div>
          </div>
          {trip.userBalance !== 0 ? (
            <div className="text-right">
              <div className="label-up">{trip.userBalance < 0 ? 'Tu dois' : 'On te doit'}</div>
              <Money
                value={trip.userBalance}
                size={16}
                weight={700}
                color={trip.userBalance < 0 ? '#A0496B' : '#2F7A6A'}
                sign={trip.userBalance < 0 ? 'neg' : 'pos'}
              />
            </div>
          ) : (
            <Chip tone="ghost" size="sm">Équilibré</Chip>
          )}
        </div>
        {/* Progress */}
        {trip.budget !== null ? (
          <>
            <div className="mt-3.5 flex justify-between text-[11px] font-semibold text-ink-3">
              <span>
                Dépensé · <Money value={trip.totalSpent} size={11} weight={600} color="#2F4550" currency={trip.currency === 'EUR' ? '€' : trip.currency} />
              </span>
              <span>
                Budget · <Money value={trip.budget} size={11} weight={600} color="#2F4550" currency={trip.currency === 'EUR' ? '€' : trip.currency} />
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-bg">
              <div
                className="h-full rounded-pill"
                style={{
                  width: `${pct * 100}%`,
                  background: 'linear-gradient(90deg, #2F4550, #B8DBD9)',
                }}
              />
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
}

export function TripCardSmall({ trip, muted = false }: { trip: BaseTrip; muted?: boolean }) {
  const memberCount = trip.members.length;
  const cover = coverFromId(trip.id);
  return (
    <div
      className={`relative flex items-center gap-3.5 rounded-[18px] bg-surface px-3.5 py-3 shadow-card ${muted ? 'opacity-75' : ''}`}
    >
      <Link
        href={`/trips/${trip.id}`}
        aria-label={`Voir ${trip.title}`}
        className="absolute inset-0 z-0 rounded-[18px]"
      />
      <div
        className="pointer-events-none relative z-[1] h-[46px] w-[46px] flex-shrink-0 overflow-hidden rounded-[14px]"
        style={trip.hasCover ? undefined : { background: cover }}
      >
        {trip.hasCover ? (
          <img
            src={coverImage(trip.id)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-black/10" />
        )}
      </div>
      <div className="pointer-events-none relative z-[1] min-w-0 flex-1">
        <div className="text-[15px] font-bold tracking-[-0.01em] text-ink">{trip.title}</div>
        <div className="mt-0.5 text-[11.5px] font-medium text-ink-3">
          {formatDates(trip.startDate, trip.endDate)} · {memberCount} pers.
        </div>
      </div>
      <div className="pointer-events-none relative z-[1] flex items-center gap-2">
        {trip.userBalance !== 0 ? (
          <div className="text-right">
            <Money
              value={trip.userBalance}
              size={13}
              weight={700}
              color={trip.userBalance < 0 ? '#A0496B' : '#2F7A6A'}
              sign={trip.userBalance < 0 ? 'neg' : 'pos'}
              currency={trip.currency === 'EUR' ? '€' : trip.currency}
            />
            <div className="mt-0.5 text-[10px] font-semibold text-ink-3">
              {trip.userBalance < 0 ? 'à payer' : 'à recevoir'}
            </div>
          </div>
        ) : (
          <Chip tone="ghost" size="sm">Équilibré</Chip>
        )}
      </div>
      <Link
        href={`/trips/${trip.id}/accounts`}
        aria-label="Voir les comptes"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-btn border border-line2 bg-bg text-ink hover:bg-surface"
      >
        <IcWallet size={16} sw={1.8} />
      </Link>
    </div>
  );
}
