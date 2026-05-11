'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { IcSparkle } from './icons';

interface InviteResponse {
  token: string;
  expiresAt: string;
}

export function InviteButton({ tripId }: { tripId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ttlHours, setTtlHours] = useState(72);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<InviteResponse>(`/trips/${tripId}/invites`, {
        method: 'POST',
        body: JSON.stringify({ ttlHours }),
      });
      setLink(`${window.location.origin}/j/${res.token}`);
      setExpiresAt(res.expiresAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-card-lg bg-ink p-4 text-white">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-[140px] w-[140px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(184,219,217,0.3) 0%, rgba(184,219,217,0) 70%)',
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <div
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ background: 'rgba(184,219,217,0.15)', color: '#B8DBD9' }}
          >
            <IcSparkle size={18} sw={1.8} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-white">Inviter par lien</div>
            <div className="text-[11px] text-white/60">Expire automatiquement</div>
          </div>
        </div>

        {!link ? (
          <>
            <div className="mt-3 flex gap-1.5">
              {[24, 72, 168].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTtlHours(h)}
                  className={
                    ttlHours === h
                      ? 'flex-1 rounded-pill bg-accent px-3 py-1.5 text-[12px] font-bold text-accent-ink'
                      : 'flex-1 rounded-pill bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/70'
                  }
                >
                  {h === 24 ? '24 h' : h === 72 ? '3 jours' : '7 jours'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="mt-2.5 inline-flex w-full items-center justify-center rounded-input bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-ink disabled:opacity-40"
            >
              {loading ? 'Génération…' : 'Générer le lien'}
            </button>
          </>
        ) : (
          <>
            <p className="mono mt-3 break-all rounded-[12px] bg-white/10 p-2.5 text-[11px] text-accent">
              {link}
            </p>
            {expiresAt ? (
              <p className="mt-1.5 text-[10px] text-white/55">
                Expire le {new Date(expiresAt).toLocaleString('fr-FR')}
              </p>
            ) : null}
            <div className="mt-2.5 flex gap-1.5">
              <button
                type="button"
                onClick={copy}
                className="flex-1 rounded-pill bg-accent px-3 py-2 text-[12px] font-bold text-accent-ink"
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLink(null);
                  setExpiresAt(null);
                }}
                className="rounded-pill bg-white/10 px-3.5 py-2 text-[12px] font-semibold text-white/80"
              >
                Nouveau
              </button>
            </div>
          </>
        )}

        {error ? <p className="mt-2 text-[11px] text-accent">{error}</p> : null}
      </div>
    </div>
  );
}
