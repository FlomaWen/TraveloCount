'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Avatar, Card, Chip, Label } from '@/components/atoms';
import { IcArrowL, IcCamera, IcPlus, IcReceipt } from '@/components/icons';
import { env } from '@/lib/env';

interface Doc {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploader: { id: string; name: string };
  linkedExpenseId: string | null;
}

interface TripRef {
  id: string;
  title: string;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export default function DocumentsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripRef | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!session?.accessToken || !params?.id) return;
    try {
      const [t, list] = await Promise.all([
        apiFetch<TripRef>(`/trips/${params.id}`),
        apiFetch<Doc[]>(`/trips/${params.id}/documents`),
      ]);
      setTrip(t);
      setDocs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  useEffect(() => {
    load();
  }, [session?.accessToken, params?.id]);

  const upload = async (file: File) => {
    if (!params?.id || !session?.accessToken) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError(`Format non supporté: ${file.type}`);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Fichier trop volumineux (10 MB max)');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${env.apiUrl}/api/trips/${params.id}/documents`, {
        method: 'POST',
        headers: { authorization: `Bearer ${session.accessToken}` },
        body: form,
      });
      if (!res.ok) throw new ApiError(res.status, await res.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const download = async (doc: Doc) => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${env.apiUrl}/api/documents/${doc.id}`, {
        headers: { authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur téléchargement');
    }
  };

  if (!trip) return <main className="p-6 text-sm text-ink-3">{error ?? 'Chargement…'}</main>;

  return (
    <main className="flex min-h-screen flex-col pb-24">
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
          <h1 className="text-[16px] font-bold text-ink">Documents</h1>
        </div>
        <div className="w-9" />
      </header>

      <div className="flex flex-col gap-3 p-4">
        {/* Upload zone */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent text-accent-ink">
              <IcCamera size={18} sw={1.8} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">Joindre un document</div>
              <div className="text-[11.5px] text-ink-3">PDF, JPG, PNG · 10 MB max</div>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-accent h-[42px] px-4 text-[12.5px]"
            >
              {uploading ? '…' : 'Uploader'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </Card>

        {error ? <p className="text-sm text-neg">{error}</p> : null}

        {/* List */}
        <div>
          <div className="px-1 pb-2">
            <Label noMargin>
              {docs.length} document{docs.length > 1 ? 's' : ''}
            </Label>
          </div>
          {docs.length === 0 ? (
            <Card className="text-center text-sm text-ink-3">
              Aucun document pour ce voyage.
            </Card>
          ) : (
            <Card padding={0}>
              {docs.map((d, i) => (
                <div key={d.id}>
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-bg text-ink-2">
                      <IcReceipt size={18} sw={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold leading-tight text-ink">
                        {d.filename}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-3">
                        <Avatar id={d.uploader.id} name={d.uploader.name} size={16} />
                        <span className="font-medium">{d.uploader.name.split(' ')[0]}</span>
                        <span className="text-mute">·</span>
                        <span>{formatSize(d.sizeBytes)}</span>
                        <span className="text-mute">·</span>
                        <span>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => download(d)}
                      className="rounded-pill bg-ink px-3 py-1.5 text-[11.5px] font-bold text-white"
                    >
                      Télécharger
                    </button>
                  </div>
                  {i < docs.length - 1 ? <div className="h-px bg-line" /> : null}
                </div>
              ))}
            </Card>
          )}
          <p className="mt-2 text-[11px] text-ink-3">
            💡 Les documents téléchargés sont disponibles hors ligne grâce au cache du navigateur.
          </p>
        </div>
      </div>
    </main>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
