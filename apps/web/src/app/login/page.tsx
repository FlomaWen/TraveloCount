'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { WebviewGate } from '@/components/webview-gate';

const SLIDES = [
  {
    kicker: 'ÉTAPE 1 · PLAN',
    title: 'Organisez chaque journée du voyage.',
    body: 'Itinéraire heure par heure, réservations partagées, et tout le monde reste à la même page.',
    art: 'plan',
  },
  {
    kicker: 'ÉTAPE 2 · DÉPENSES',
    title: 'Tracez qui paie quoi sans calculer.',
    body: 'Chaque dépense est partagée automatiquement. Devises étrangères converties au taux du jour.',
    art: 'expenses',
  },
  {
    kicker: 'ÉTAPE 3 · ÉQUILIBRE',
    title: 'Réglez en un seul virement à la fin.',
    body: 'Algorithme de simplification : on minimise le nombre de transferts pour solder vos comptes.',
    art: 'balance',
  },
] as const;

function LoginContent() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/';
  const [slide, setSlide] = useState(0);

  const current = SLIDES[slide]!;
  const isLast = slide === SLIDES.length - 1;

  return (
    <main className="flex min-h-screen flex-col bg-ink p-6 text-white">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSlide(SLIDES.length - 1)}
          className="text-[12px] font-semibold text-white/60 hover:text-white"
        >
          Passer →
        </button>
      </div>

      <div className="mono mt-6 text-[11px] tracking-[0.16em] text-white/55">
        {String(slide + 1).padStart(2, '0')} / 03
      </div>

      <div className="mt-8 flex flex-1 flex-col items-start justify-end">
        <SlideArt name={current.art} />
        <div className="mono mt-10 text-[12px] font-semibold tracking-[0.08em] text-accent">
          {current.kicker}
        </div>
        <h1 className="mt-3 text-h1-onb text-white">{current.title}</h1>
        <p className="mt-3 text-[14px] leading-[1.5] text-white/70">{current.body}</p>
      </div>

      {/* Progress segments */}
      <div className="mt-8 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSlide(i)}
            className={`h-1 rounded-full transition-all ${
              i === slide ? 'flex-[2] bg-accent' : 'flex-1 bg-white/20'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {isLast ? (
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
            className="inline-flex h-[54px] w-full items-center justify-center rounded-input bg-accent text-[14px] font-bold text-accent-ink hover:bg-accent-2"
          >
            Continuer avec Google
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSlide((s) => Math.min(SLIDES.length - 1, s + 1))}
            className="inline-flex h-[54px] w-full items-center justify-center rounded-input bg-white text-[14px] font-bold text-ink hover:bg-white/90"
          >
            Suivant
          </button>
        )}
      </div>
    </main>
  );
}

function SlideArt({ name }: { name: 'plan' | 'expenses' | 'balance' }) {
  if (name === 'plan') {
    return (
      <svg viewBox="0 0 200 140" className="w-full max-w-[260px]">
        <rect x="20" y="20" width="160" height="36" rx="12" fill="rgba(184,219,217,0.18)" />
        <rect x="32" y="30" width="80" height="6" rx="3" fill="#B8DBD9" />
        <rect x="32" y="42" width="50" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
        <circle cx="160" cy="38" r="10" fill="#B8DBD9" />
        <rect x="20" y="70" width="120" height="36" rx="12" fill="rgba(255,255,255,0.08)" />
        <rect x="32" y="80" width="60" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
        <rect x="32" y="92" width="40" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      </svg>
    );
  }
  if (name === 'expenses') {
    return (
      <svg viewBox="0 0 200 140" className="w-full max-w-[260px]">
        <rect x="20" y="20" width="160" height="100" rx="14" fill="rgba(184,219,217,0.10)" />
        <text x="100" y="80" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="36" fontWeight="700" fill="#B8DBD9">
          1 240,00€
        </text>
        <text x="100" y="100" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="11" fill="rgba(255,255,255,0.5)">
          ÷ 4 PERSONNES
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[260px]">
      <circle cx="40" cy="70" r="22" fill="rgba(160,73,107,0.25)" />
      <text x="40" y="76" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="14" fontWeight="700" fill="#fff">
        LM
      </text>
      <path d="M70 70 L130 70" stroke="#B8DBD9" strokeWidth="2" strokeDasharray="4,4" />
      <polygon points="130,65 140,70 130,75" fill="#B8DBD9" />
      <circle cx="160" cy="70" r="22" fill="rgba(47,122,106,0.30)" />
      <text x="160" y="76" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="14" fontWeight="700" fill="#fff">
        MR
      </text>
      <text x="100" y="115" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="14" fontWeight="600" fill="#B8DBD9">
        208,40 €
      </text>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <WebviewGate>
      <Suspense fallback={<main className="min-h-screen bg-ink" />}>
        <LoginContent />
      </Suspense>
    </WebviewGate>
  );
}
