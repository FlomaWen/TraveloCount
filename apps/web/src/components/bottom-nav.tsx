'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IcCompass, IcChart, IcPlus, IcSparkle, IcUser } from './icons';

interface Tab {
  id: string;
  label: string;
  href: string;
  icon: typeof IcCompass;
}

const TABS: Tab[] = [
  { id: 'trips', label: 'Voyages', href: '/', icon: IcCompass },
  { id: 'activity', label: 'Activité', href: '/activity', icon: IcSparkle },
  { id: 'stats', label: 'Stats', href: '/stats', icon: IcChart },
  { id: 'profile', label: 'Profil', href: '/profile', icon: IcUser },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-mobile justify-center px-4 pb-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <div
        className="pointer-events-auto flex w-full items-center gap-1 rounded-pill px-2 py-2"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 24px rgba(12,26,34,0.08), 0 0 0 1px rgba(47,69,80,0.06)',
        }}
      >
        {TABS.slice(0, 2).map((t) => (
          <TabLink key={t.id} tab={t} active={pathname === t.href} />
        ))}
        <Link
          href="/trips/new"
          aria-label="Nouveau voyage"
          className="inline-flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full bg-ink text-white shadow-fab"
        >
          <IcPlus size={22} sw={2.4} />
        </Link>
        {TABS.slice(2).map((t) => (
          <TabLink key={t.id} tab={t} active={pathname === t.href} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Ic = tab.icon;
  return (
    <Link
      href={tab.href}
      className={`flex h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-pill text-[10px] font-semibold ${
        active ? 'text-ink' : 'text-ink-3'
      }`}
    >
      <Ic size={20} sw={active ? 2 : 1.8} />
      <span>{tab.label}</span>
    </Link>
  );
}
