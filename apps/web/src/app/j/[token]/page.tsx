'use client';

import { signIn, useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { formatDateRange } from '@/lib/format';
import { LoadingFallback, Skeleton } from '@/components/skeleton';

interface InvitePreview {
  trip: {
    id: string;
    title: string;
    destination: string | null;
    startDate: string | null;
    endDate: string | null;
    memberCount: number;
  };
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!params?.token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/invites/${params.token}`)
      .then(async (r) => {
        if (r.status === 410) throw new Error('Lien expiré ou déjà utilisé');
        if (r.status === 404) throw new Error('Lien invalide');
        if (!r.ok) throw new Error('Erreur de chargement');
        return r.json();
      })
      .then(setPreview)
      .catch((e) => setError(e.message));
  }, [params?.token]);

  const accept = async () => {
    if (!params?.token) return;
    setAccepting(true);
    setError(null);
    try {
      const { tripId } = await apiFetch<{ tripId: string }>(`/invites/${params.token}/accept`, {
        method: 'POST',
      });
      router.push(`/trips/${tripId}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 410) setError('Lien expiré ou déjà utilisé');
      else setError(e instanceof Error ? e.message : 'Erreur');
      setAccepting(false);
    }
  };

  const signInThenAccept = () => {
    signIn('google', { callbackUrl: `/j/${params?.token}` });
  };

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <p className="text-2xl">⌛</p>
        <h1 className="mt-3 text-xl font-semibold">{error}</h1>
        <p className="mt-2 text-sm text-charcoal-400">Demande un nouveau lien à l'organisateur.</p>
      </main>
    );
  }

  if (!preview) {
    return (
      <main className="p-6">
        <LoadingFallback
          skeleton={
            <div className="mx-auto max-w-md rounded-card bg-surface p-6 shadow-card">
              <div className="flex flex-col items-center gap-3">
                <Skeleton width={60} height={60} radius={9999} />
                <Skeleton width="70%" height={20} radius={4} />
                <Skeleton width="50%" height={14} radius={4} />
                <Skeleton width="40%" height={12} radius={4} />
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Skeleton width="100%" height={48} radius={12} />
                <Skeleton width="100%" height={40} radius={12} />
              </div>
            </div>
          }
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col justify-between p-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-charcoal-400">Invitation au voyage</p>
        <h1 className="mt-2 text-3xl font-bold">{preview.trip.title}</h1>
        {preview.trip.destination ? (
          <p className="mt-1 text-sm text-charcoal-500">{preview.trip.destination}</p>
        ) : null}
        <p className="mt-1 text-sm text-charcoal-400">
          {formatDateRange(preview.trip.startDate, preview.trip.endDate)}
        </p>

        <div className="card mt-6">
          <p className="text-[10px] uppercase tracking-widest text-charcoal-400">Membres</p>
          <p className="mt-1 text-sm">{preview.trip.memberCount} personne{preview.trip.memberCount > 1 ? 's' : ''} déjà dans le groupe</p>
        </div>

        <p className="mt-4 text-[10px] text-charcoal-400">
          Lien valide jusqu'au {new Date(preview.expiresAt).toLocaleString('fr-FR')}
        </p>
      </div>

      <div className="pb-4">
        {status === 'authenticated' && session ? (
          <button onClick={accept} disabled={accepting} className="btn-primary w-full">
            {accepting ? 'Inscription…' : `Rejoindre en tant que ${session.user?.name?.split(' ')[0]}`}
          </button>
        ) : (
          <button onClick={signInThenAccept} className="btn-primary w-full">
            Continuer avec Google pour rejoindre
          </button>
        )}
      </div>
    </main>
  );
}
