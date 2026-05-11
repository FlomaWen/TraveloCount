'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Card, Chip, Divider, initialsOf } from '@/components/atoms';
import { BottomNav } from '@/components/bottom-nav';
import {
  IcArrowR,
  IcBell,
  IcCompass,
  IcMap,
  IcSparkle,
  IcSwap,
  IcUser,
  IcUsers,
  IcX,
} from '@/components/icons';
import {
  AboutSheet,
  CurrencySheet,
  DEFAULT_NOTIF_PREFS,
  IdentitySheet,
  NotificationsSheet,
  type NotifPrefs,
} from '@/components/profile-sheets';

interface Trip {
  id: string;
  title: string;
}

type SheetId = 'identity' | 'currency' | 'notifications' | 'about' | null;

const STORAGE_KEY = 'travelocount.prefs';

interface StoredPrefs {
  currency: string;
  notif: NotifPrefs;
}

const DEFAULT_PREFS: StoredPrefs = {
  currency: 'EUR',
  notif: DEFAULT_NOTIF_PREFS,
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [prefs, setPrefs] = useState<StoredPrefs>(DEFAULT_PREFS);

  // Hydrate prefs from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
      setPrefs({
        currency: parsed.currency ?? DEFAULT_PREFS.currency,
        notif: { ...DEFAULT_PREFS.notif, ...(parsed.notif ?? {}) },
      });
    } catch {
      // ignore
    }
  }, []);

  const updatePrefs = (next: StoredPrefs) => {
    setPrefs(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  useEffect(() => {
    if (!session?.accessToken) return;
    apiFetch<Trip[]>('/trips')
      .then((t) => setTripCount(t.length))
      .catch(() => setTripCount(0));
  }, [session?.accessToken]);

  const name = session?.user?.name ?? 'Utilisateur';
  const email = session?.user?.email ?? '—';
  const initials = initialsOf(name);

  const sessionLite = {
    name: session?.user?.name,
    email: session?.user?.email,
    userId: session?.userId,
  };

  const sections: Section[] = [
    {
      head: 'Compte',
      rows: [
        { Ic: IcUser, label: 'Identité', value: name, onClick: () => setSheet('identity') },
        {
          Ic: IcSwap,
          label: 'Devise par défaut',
          value: `${prefs.currency} · ${currencySymbol(prefs.currency)}`,
          onClick: () => setSheet('currency'),
        },
      ],
    },
    {
      head: 'Notifications',
      rows: [
        {
          Ic: IcBell,
          label: 'Nouvelles dépenses',
          value: prefs.notif.newExpenses ? 'Activé' : 'Désactivé',
          onClick: () => setSheet('notifications'),
        },
        {
          Ic: IcUsers,
          label: 'Activité du groupe',
          value: prefs.notif.groupActivity,
          onClick: () => setSheet('notifications'),
        },
        {
          Ic: IcSparkle,
          label: 'Astuces de voyage',
          value: prefs.notif.tips,
          onClick: () => setSheet('notifications'),
        },
      ],
    },
    {
      head: 'App',
      rows: [
        {
          Ic: IcCompass,
          label: "Revoir l'intro",
          value: '',
          onClick: () => signOut({ callbackUrl: '/login' }),
        },
        {
          Ic: IcMap,
          label: 'À propos',
          value: 'v0.1.0',
          onClick: () => setSheet('about'),
        },
        {
          Ic: IcX,
          label: 'Se déconnecter',
          value: '',
          danger: true,
          onClick: () => signOut({ callbackUrl: '/login' }),
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen pb-24">
      <header className="flex items-center justify-between px-5 pt-3">
        <div>
          <div className="label-up">Mon compte</div>
          <h1 className="mt-0.5 text-h1-screen text-ink">Profil</h1>
        </div>
      </header>

      {/* Hero card */}
      <div className="px-4 pt-3">
        <div className="relative overflow-hidden rounded-card-lg bg-ink p-[22px] text-white">
          <div
            className="pointer-events-none absolute -right-8 -bottom-8 h-[160px] w-[160px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(184,219,217,0.32) 0%, rgba(184,219,217,0) 70%)',
            }}
          />
          <div className="relative flex items-center gap-3.5">
            <div className="flex h-[62px] w-[62px] flex-shrink-0 items-center justify-center rounded-[18px] bg-accent text-[24px] font-bold text-accent-ink">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[18px] font-bold tracking-[-0.01em]">{name}</div>
              <div className="mt-0.5 truncate text-[12px] font-medium text-white/65">{email}</div>
              <div className="mt-2 flex gap-1.5">
                <Chip tone="accent" size="sm">PLUS</Chip>
                {tripCount !== null ? (
                  <Chip tone="dark" size="sm">
                    {tripCount} voyage{tripCount > 1 ? 's' : ''}
                  </Chip>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="px-4 pt-3">
        {sections.map((s) => (
          <section key={s.head} className="mb-3.5">
            <div className="px-2 pb-2 pt-2.5 label-up-bold">{s.head}</div>
            <Card padding={0}>
              {s.rows.map((r, i) => {
                const Ic = r.Ic;
                return (
                  <div key={r.label}>
                    <button
                      type="button"
                      onClick={r.onClick}
                      className="flex w-full items-center gap-3.5 px-3.5 py-3 text-left transition hover:bg-bg"
                    >
                      <span
                        className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-bg ${
                          r.danger ? 'text-neg' : 'text-ink-2'
                        }`}
                      >
                        <Ic size={17} sw={1.8} />
                      </span>
                      <span
                        className={`flex-1 text-[13.5px] font-semibold ${
                          r.danger ? 'text-neg' : 'text-ink'
                        }`}
                      >
                        {r.label}
                      </span>
                      {r.value ? (
                        <span className="text-[12px] font-semibold text-ink-3">{r.value}</span>
                      ) : null}
                      <IcArrowR size={14} sw={2} className="text-mute" />
                    </button>
                    {i < s.rows.length - 1 ? <Divider inset={62} /> : null}
                  </div>
                );
              })}
            </Card>
          </section>
        ))}
      </div>

      <BottomNav />

      {sheet === 'identity' ? (
        <IdentitySheet session={sessionLite} onClose={() => setSheet(null)} />
      ) : null}
      {sheet === 'currency' ? (
        <CurrencySheet
          current={prefs.currency}
          onChange={(c) => updatePrefs({ ...prefs, currency: c })}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === 'notifications' ? (
        <NotificationsSheet
          prefs={prefs.notif}
          onChange={(n) => updatePrefs({ ...prefs, notif: n })}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === 'about' ? <AboutSheet onClose={() => setSheet(null)} /> : null}
    </main>
  );
}

function currencySymbol(code: string): string {
  return code === 'EUR' ? '€' : code === 'USD' ? '$' : code === 'GBP' ? '£' : code;
}

interface Section {
  head: string;
  rows: {
    Ic: (p: { size?: number; sw?: number; className?: string }) => React.ReactElement;
    label: string;
    value: string;
    danger?: boolean;
    onClick: () => void;
  }[];
}
