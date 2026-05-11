import { initials } from '@/lib/format';

interface Member {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export function MemberAvatars({ members, size = 'sm' }: { members: Member[]; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 'size-8 text-xs' : 'size-6 text-[10px]';
  return (
    <div className="flex -space-x-2">
      {members.slice(0, 4).map((m) => (
        <span
          key={m.id}
          title={m.name}
          className={`${px} flex items-center justify-center rounded-full border-2 border-charcoal-900 bg-mint-200 font-semibold text-charcoal-900`}
        >
          {initials(m.name)}
        </span>
      ))}
      {members.length > 4 ? (
        <span className={`${px} flex items-center justify-center rounded-full border-2 border-charcoal-900 bg-charcoal-700 text-white`}>
          +{members.length - 4}
        </span>
      ) : null}
    </div>
  );
}
