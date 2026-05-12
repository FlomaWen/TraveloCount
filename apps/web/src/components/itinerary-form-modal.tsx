'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Label } from './atoms';
import { Sheet } from './sheet';
import { CatIcon, IcPin } from './icons';

const TYPES = [
  { value: 'TRANSPORT', label: 'Transport', icon: 'car' as const },
  { value: 'LODGING', label: 'Logement', icon: 'bed' as const },
  { value: 'MEAL', label: 'Repas', icon: 'fork' as const },
  { value: 'ACTIVITY', label: 'Activité', icon: 'ticket' as const },
] as const;

interface GeocodeMatch {
  label: string;
  lat: number;
  lng: number;
}

export interface ItineraryEditItem {
  id: string;
  day: number;
  time: string | null;
  type: (typeof TYPES)[number]['value'];
  title: string;
  details: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

interface Props {
  tripId: string;
  totalDays: number | null;
  defaultDay: number;
  item?: ItineraryEditItem;
  canDelete?: boolean;
  onClose: () => void;
  onCreated: () => void;
  onDeleted?: () => void;
}

export function ItineraryFormModal({
  tripId,
  totalDays,
  defaultDay,
  item,
  canDelete,
  onClose,
  onCreated,
  onDeleted,
}: Props) {
  const isEdit = item !== undefined;
  const [day, setDay] = useState(item?.day ?? defaultDay);
  const [time, setTime] = useState(item?.time ?? '');
  const [type, setType] = useState<(typeof TYPES)[number]['value']>(item?.type ?? 'ACTIVITY');
  const [title, setTitle] = useState(item?.title ?? '');
  const [details, setDetails] = useState(item?.details ?? '');
  const [address, setAddress] = useState(item?.address ?? '');
  const [matches, setMatches] = useState<GeocodeMatch[]>([]);
  const [picked, setPicked] = useState<GeocodeMatch | null>(
    item && item.lat !== null && item.lng !== null && item.address
      ? { label: item.address, lat: item.lat, lng: item.lng }
      : null,
  );
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (address.trim().length < 3) return;
    setSearching(true);
    setError(null);
    try {
      const results = await apiFetch<GeocodeMatch[]>(
        `/geocode?q=${encodeURIComponent(address.trim())}`,
      );
      setMatches(results);
      if (results.length === 0) setError('Aucun résultat');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur géocodage');
    } finally {
      setSearching(false);
    }
  };

  const submit = async () => {
    if (!title) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = JSON.stringify({
        day,
        time: time || null,
        type,
        title,
        details: details || null,
        address: picked?.label ?? (address || null),
        lat: picked?.lat ?? null,
        lng: picked?.lng ?? null,
      });
      if (isEdit && item) {
        await apiFetch(`/trips/${tripId}/itinerary/${item.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch(`/trips/${tripId}/itinerary`, { method: 'POST', body });
      }
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!isEdit || !item || deleting) return;
    if (!window.confirm('Supprimer cette étape ?')) return;
    setError(null);
    setDeleting(true);
    try {
      await apiFetch(`/trips/${tripId}/itinerary/${item.id}`, { method: 'DELETE' });
      if (onDeleted) onDeleted();
      else onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setDeleting(false);
    }
  };

  const maxDay = totalDays ?? 14;

  return (
    <Sheet
      onClose={onClose}
      title={isEdit ? 'Modifier étape' : 'Nouvelle étape'}
      action={
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !title}
          className="rounded-[9px] bg-ink px-3 py-[7px] text-[12px] font-bold text-white disabled:opacity-40"
        >
          {submitting ? '…' : isEdit ? 'Enregistrer' : 'Ajouter'}
        </button>
      }
    >
      <div className="space-y-4 px-4 pb-6 pt-2">
        <div>
          <Label>Type</Label>
          <div className="flex gap-2 overflow-x-auto">
            {TYPES.map((t) => {
              const active = t.value === type;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-btn px-3 py-2.5 text-[12.5px] font-semibold ${
                    active ? 'bg-ink text-white' : 'bg-bg text-ink-2'
                  }`}
                >
                  <CatIcon name={t.icon} size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <label className="flex-1">
            <Label>Jour</Label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="input"
            >
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Jour {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1">
            <Label>Heure</Label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input"
            />
          </label>
        </div>

        <label className="block">
          <Label>Titre *</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            placeholder="Ex. Palais de la Pena"
            className="input"
          />
        </label>

        <label className="block">
          <Label>Détails</Label>
          <input
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Ex. Billets coupe-file · 14€"
            className="input"
          />
        </label>

        <div>
          <Label>Lieu (optionnel)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setPicked(null);
                }}
                placeholder="Adresse, monument…"
                className="input pl-9"
              />
              <IcPin size={16} sw={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            </div>
            <button
              type="button"
              onClick={search}
              disabled={searching || address.length < 3}
              className="btn-ghost h-[50px] px-4"
            >
              {searching ? '…' : 'Chercher'}
            </button>
          </div>

          {matches.length > 0 && !picked ? (
            <ul className="mt-2 space-y-1.5 overflow-hidden rounded-card bg-surface shadow-card">
              {matches.map((m, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(m);
                      setMatches([]);
                    }}
                    className="block w-full px-3.5 py-2.5 text-left text-[12.5px] font-medium text-ink hover:bg-bg"
                  >
                    {m.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {picked ? (
            <div className="mt-2 rounded-card bg-accent/30 p-3 text-[12px] text-accent-ink">
              <strong>Lieu choisi :</strong> {picked.label}
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  setAddress('');
                }}
                className="ml-2 text-[11px] underline"
              >
                Changer
              </button>
            </div>
          ) : null}
        </div>

        {error ? <p className="text-sm text-neg">{error}</p> : null}

        {isEdit && canDelete ? (
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-input border border-line2 bg-surface px-5 py-3 text-[13px] font-bold text-neg disabled:opacity-50"
          >
            {deleting ? 'Suppression…' : 'Supprimer cette étape'}
          </button>
        ) : null}
      </div>
    </Sheet>
  );
}
