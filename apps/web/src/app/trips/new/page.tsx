'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { coverFromId, DotGridOverlay, SkylineOverlay, Label } from '@/components/atoms';
import { IcArrowL, IcArrowR, IcX } from '@/components/icons';

type Ambiance = 'CITY_BREAK' | 'MOUNTAIN' | 'BEACH' | 'ROAD_TRIP';

const AMBIANCES: { value: Ambiance; label: string }[] = [
  { value: 'CITY_BREAK', label: 'City break' },
  { value: 'MOUNTAIN', label: 'Montagne' },
  { value: 'BEACH', label: 'Plage' },
  { value: 'ROAD_TRIP', label: 'Road trip' },
];

interface CreatedTrip {
  id: string;
}

export default function NewTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datesUndefined, setDatesUndefined] = useState(false);
  const [ambiance, setAmbiance] = useState<Ambiance>('CITY_BREAK');
  const [budget, setBudget] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCover = coverFromId(title || 'preview');

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const trip = await apiFetch<CreatedTrip>('/trips', {
        method: 'POST',
        body: JSON.stringify({
          title,
          destination: destination || undefined,
          startDate: datesUndefined || !startDate ? undefined : new Date(startDate).toISOString(),
          endDate: datesUndefined || !endDate ? undefined : new Date(endDate).toISOString(),
          ambiance,
          budget: budget ? Number(budget) : undefined,
        }),
      });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setSubmitting(false);
    }
  };

  const canNext = step === 0 ? title.length > 0 : true;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
          aria-label="Fermer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-bg text-ink"
        >
          {step === 0 ? <IcX size={18} sw={2} /> : <IcArrowL size={18} sw={2} />}
        </button>
        <h1 className="text-[15px] font-bold text-ink">Nouveau voyage</h1>
        <div className="w-9" />
      </header>

      {/* Stepper */}
      <ol className="mb-4 flex items-center gap-1 px-4 text-[10px] font-bold uppercase tracking-[0.06em]">
        {['Voyage', 'Équipe', 'Budget'].map((s, i) => (
          <li
            key={s}
            className={`flex-1 rounded-pill py-1 text-center ${
              i === step ? 'bg-ink text-white' : i < step ? 'bg-accent text-accent-ink' : 'bg-bg text-ink-3'
            }`}
          >
            {i + 1} · {s}
          </li>
        ))}
      </ol>

      {/* Preview cover */}
      <div className="px-4">
        <div
          className="relative h-32 overflow-hidden rounded-card-lg"
          style={{ background: previewCover }}
        >
          <DotGridOverlay opacity={0.18} />
          <SkylineOverlay />
          <div className="absolute left-4 top-3 mono text-[10px] tracking-[0.16em] text-white/70">
            APERÇU · COUVERTURE
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-h2-card">{title || 'Mon prochain voyage'}</p>
            <p className="text-[12px] text-white/70">
              {datesUndefined || !startDate || !endDate
                ? 'Dates à définir'
                : `${formatDateShort(startDate)} → ${formatDateShort(endDate)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-8 pt-5">
        {step === 0 ? (
          <>
            <Field label="Titre du voyage" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                placeholder="Ex. Lisbonne en mai"
                className="input"
              />
            </Field>

            <Field label="Destination">
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ex. Lisbonne, Portugal"
                className="input"
              />
            </Field>

            <Field label="Dates">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={datesUndefined}
                  className="input flex-1"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={datesUndefined}
                  min={startDate || undefined}
                  className="input flex-1"
                />
              </div>
              <label className="mt-2 flex items-center gap-2 text-[12px] font-medium text-ink-3">
                <input
                  type="checkbox"
                  checked={datesUndefined}
                  onChange={(e) => setDatesUndefined(e.target.checked)}
                />
                Dates à définir plus tard
              </label>
            </Field>

            <Field label="Ambiance">
              <div className="grid grid-cols-2 gap-2">
                {AMBIANCES.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAmbiance(a.value)}
                    className={`rounded-card border-2 p-4 text-left text-[14px] font-semibold transition ${
                      ambiance === a.value
                        ? 'border-ink bg-ink text-white'
                        : 'border-line2 bg-surface text-ink-2'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </Field>
          </>
        ) : step === 1 ? (
          <Field label="Équipe">
            <p className="rounded-card bg-surface p-4 text-[13px] text-ink-3 shadow-card">
              Tu pourras inviter ton équipe par lien une fois le voyage créé.
            </p>
          </Field>
        ) : (
          <Field label="Budget total (optionnel)">
            <div className="relative">
              <input
                type="number"
                step="10"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="input pr-10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-ink-3">
                €
              </span>
            </div>
            <p className="mt-2 text-[12px] text-ink-3">
              Sert d'objectif pour suivre vos dépenses. Modifiable plus tard.
            </p>
          </Field>
        )}

        {error ? <p className="text-sm text-neg">{error}</p> : null}

        <div className="mt-auto">
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="btn-primary w-full"
            >
              Continuer <IcArrowR size={16} sw={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !title}
              className="btn-primary w-full"
            >
              {submitting ? 'Création…' : 'Créer le voyage'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <Label>
        {label} {required ? '*' : ''}
      </Label>
      {children}
    </label>
  );
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
