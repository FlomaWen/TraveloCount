import Link from 'next/link';
import { IcChat, IcCompass, IcMap, IcReceipt, IcWallet } from './icons';

export function TabBar({
  tripId,
  active,
}: {
  tripId: string;
  active: 'overview' | 'expenses' | 'itinerary' | 'balance' | 'chat';
}) {
  const tabs = [
    { id: 'overview', label: 'Vue', icon: IcCompass, href: `/trips/${tripId}` },
    { id: 'expenses', label: 'Dépenses', icon: IcReceipt, href: `/trips/${tripId}/expenses` },
    { id: 'itinerary', label: 'Itinéraire', icon: IcMap, href: `/trips/${tripId}/itinerary` },
    { id: 'balance', label: 'Comptes', icon: IcWallet, href: `/trips/${tripId}/accounts` },
    { id: 'chat', label: 'Chat', icon: IcChat, href: `/trips/${tripId}/chat` },
  ] as const;
  return (
    <nav className="flex gap-1 border-y border-line bg-surface p-1.5">
      {tabs.map((t) => {
        const Ic = t.icon;
        const isActive = t.id === active;
        return (
          <Link
            key={t.id}
            href={t.href}
            className={`flex h-10 flex-1 flex-col items-center justify-center gap-0.5 rounded-btn text-[10.5px] transition ${
              isActive ? 'bg-ink font-bold text-white' : 'font-semibold text-ink-3 hover:bg-bg'
            }`}
          >
            <Ic size={15} sw={1.9} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
