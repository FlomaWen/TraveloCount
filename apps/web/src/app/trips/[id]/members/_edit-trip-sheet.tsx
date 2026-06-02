'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { env } from '@/lib/env';
import { Label } from '@/components/atoms';
import { Sheet } from '@/components/sheet';
import { AMBIANCE_LABELS, type TripAmbiance, type TripDetail } from './_constants';

export function EditTripSheet({
  trip,
  onClose,
  onSave,
  onCoverChanged,
}: {
  trip: TripDetail;
  onClose: () => void;
  onSave: (patch: {
    title?: string;
    destination?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    ambiance?: TripAmbiance | null;
    budget?: number | null;
  }) => Promise<void> | void;
  onCoverChanged: () => void;
}) {
  const { data: session } = useSession();
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination ?? '');
  const [startDate, setStartDate] = useState(
    trip.startDate ? new Date(trip.startDate).toISOString().slice(0, 10) : '',
  );
  const [endDate, setEndDate] = useState(
    trip.endDate ? new Date(trip.endDate).toISOString().slice(0, 10) : '',
  );
  const [ambiance, setAmbiance] = useState<TripAmbiance | ''>(trip.ambiance ?? '');
  const [budget, setBudget] = useState(trip.budget !== null ? String(trip.budget) : '');
  const [saving, setSaving] = useState(false);
  const [coverVersion, setCoverVersion] = useState(0);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadCover = async (file: File) => {
    if (!session?.accessToken) return;
    setCoverError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCoverError(`Format non supporté: ${file.type}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError('Image trop volumineuse (5 MB max)');
      return;
    }
    setCoverBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${env.apiUrl}/api/trips/${trip.id}/cover`, {
        method: 'POST',
        headers: { authorization: `Bearer ${session.accessToken}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      setCoverVersion((v) => v + 1);
      onCoverChanged();
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setCoverBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeCover = async () => {
    if (coverBusy) return;
    setCoverError(null);
    setCoverBusy(true);
    try {
      await apiFetch(`/trips/${trip.id}/cover`, { method: 'DELETE' });
      setCoverVersion((v) => v + 1);
      onCoverChanged();
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setCoverBusy(false);
    }
  };

  const coverUrl =
    trip.hasCover && coverVersion >= 0
      ? `${env.apiUrl}/api/trips/${trip.id}/cover?v=${coverVersion}`
      : null;

  const save = async () => {
    setSaving(true);
    const budgetNum = budget.trim() === '' ? null : Number(budget.replace(',', '.'));
    await onSave({
      title: title.trim(),
      destination: destination.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      ambiance: ambiance || null,
      budget: budgetNum && !Number.isNaN(budgetNum) ? budgetNum : null,
    });
    setSaving(false);
  };

  return (
    <Sheet
      onClose={onClose}
      title="Modifier le voyage"
      action={
        <button
          type="button"
          onClick={save}
          disabled={saving || title.trim().length === 0}
          className="rounded-[9px] bg-ink px-3 py-[7px] text-[12px] font-bold text-white disabled:opacity-40"
        >
          {saving ? '…' : 'Enregistrer'}
        </button>
      }
    >
      <div className="space-y-4 px-4 pb-6 pt-2">
        <div>
          <Label>Image d'affiche</Label>
          <div className="relative overflow-hidden rounded-card bg-bg" style={{ aspectRatio: '16 / 9' }}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-ink-3">
                Aucune image
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadCover(f);
            }}
            className="hidden"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={coverBusy}
              className="flex-1 rounded-input bg-bg px-3 py-2 text-[12.5px] font-semibold text-ink disabled:opacity-50"
            >
              {coverBusy ? 'Envoi…' : trip.hasCover ? 'Changer' : 'Choisir une image'}
            </button>
            {trip.hasCover ? (
              <button
                type="button"
                onClick={removeCover}
                disabled={coverBusy}
                className="rounded-input border border-line2 px-3 py-2 text-[12.5px] font-semibold text-neg disabled:opacity-50"
              >
                Retirer
              </button>
            ) : null}
          </div>
          {coverError ? <p className="mt-1 text-[12px] text-neg">{coverError}</p> : null}
        </div>

        <label className="block">
          <Label>Titre</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="input"
          />
        </label>

        <label className="block">
          <Label>Destination</Label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            maxLength={120}
            placeholder="Ex. Lisbonne, Portugal"
            className="input"
          />
        </label>

        <div className="flex gap-2">
          <label className="flex-1">
            <Label>Début</Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </label>
          <label className="flex-1">
            <Label>Fin</Label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </label>
        </div>

        <div>
          <Label>Ambiance</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(AMBIANCE_LABELS) as TripAmbiance[]).map((amb) => {
              const active = amb === ambiance;
              return (
                <button
                  key={amb}
                  type="button"
                  onClick={() => setAmbiance(active ? '' : amb)}
                  className={`rounded-pill px-3 py-1.5 text-[12.5px] font-semibold ${
                    active ? 'bg-ink text-white' : 'bg-bg text-ink-2'
                  }`}
                >
                  {AMBIANCE_LABELS[amb]}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          <Label>Budget ({trip.currency})</Label>
          <input
            type="text"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^\d.,]/g, ''))}
            placeholder="Laisser vide pour aucun budget"
            className="input"
          />
        </label>
      </div>
    </Sheet>
  );
}
