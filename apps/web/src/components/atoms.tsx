import type { ReactNode } from 'react';
import { CatIcon, type CatIconName } from './icons';

// ─── Avatar ────────────────────────────────────────────────────

const AVATAR_TONES = ['#B8DBD9', '#2F4550', '#586F7C', '#0C1A22'] as const;

export function toneFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]!;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface AvatarProps {
  id: string;
  name: string;
  size?: number;
  ring?: boolean;
  tone?: string;
}

export function Avatar({ id, name, size = 30, ring = false, tone }: AvatarProps) {
  const bg = tone ?? toneFromId(id);
  const isLight = bg === '#B8DBD9';
  return (
    <span
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: isLight ? '#0C1A22' : '#fff',
        fontSize: size * 0.36,
        boxShadow: ring ? `0 0 0 2px #FFFFFF` : undefined,
      }}
      className="inline-flex flex-shrink-0 items-center justify-center font-semibold tracking-[0.02em]"
    >
      {initialsOf(name)}
    </span>
  );
}

interface AvatarStackProps {
  members: { id: string; name: string; tone?: string }[];
  size?: number;
  max?: number;
}

export function AvatarStack({ members, size = 26, max = 5 }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;
  return (
    <div className="flex">
      {visible.map((m, i) => (
        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar id={m.id} name={m.name} size={size} ring tone={m.tone} />
        </div>
      ))}
      {overflow > 0 ? (
        <span
          style={{
            width: size,
            height: size,
            marginLeft: -8,
            fontSize: size * 0.36,
            boxShadow: `0 0 0 2px #FFFFFF`,
          }}
          className="inline-flex items-center justify-center rounded-full bg-bg font-semibold text-ink-3"
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

// ─── Money (JetBrains Mono, tabular nums) ──────────────────────

interface MoneyProps {
  value: number;
  sign?: 'pos' | 'neg' | 'auto' | 'none';
  size?: number;
  weight?: 500 | 600 | 700;
  color?: string;
  dim?: string;
  currency?: string;
}

export function Money({
  value,
  sign = 'none',
  size = 14,
  weight = 600,
  color,
  dim,
  currency = '€',
}: MoneyProps) {
  const v = Math.abs(value);
  const display = v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const effectiveSign =
    sign === 'auto' ? (value > 0 ? 'pos' : value < 0 ? 'neg' : 'none') : sign;
  const prefix = effectiveSign === 'pos' ? '+' : effectiveSign === 'neg' ? '−' : '';
  return (
    <span
      className="mono whitespace-nowrap tracking-[-0.01em]"
      style={{ fontWeight: weight, fontSize: size, color: color ?? '#0C1A22' }}
    >
      {prefix}
      {display}
      <span
        style={{
          marginLeft: 2,
          fontSize: size * 0.78,
          color: dim ?? color ?? '#586F7C',
          fontWeight: 500,
        }}
      >
        {currency}
      </span>
    </span>
  );
}

// ─── Chip ──────────────────────────────────────────────────────

type ChipTone = 'default' | 'accent' | 'dark' | 'pos' | 'neg' | 'ghost';

const CHIP_TONES: Record<ChipTone, string> = {
  default: 'bg-[rgba(47,69,80,0.07)] text-ink-2',
  accent: 'bg-accent text-accent-ink',
  dark: 'bg-ink text-white',
  pos: 'bg-[rgba(47,122,106,0.12)] text-pos',
  neg: 'bg-[rgba(160,73,107,0.12)] text-neg',
  ghost: 'border border-line2 bg-transparent text-ink-3',
};

export function Chip({
  children,
  tone = 'default',
  size = 'md',
}: {
  children: ReactNode;
  tone?: ChipTone;
  size?: 'sm' | 'md';
}) {
  const pad = size === 'sm' ? 'px-2 py-[3px] text-[11px]' : 'px-2.5 py-[5px] text-[12px]';
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-pill font-semibold tracking-[0.01em] ${pad} ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

// ─── Card & Divider ────────────────────────────────────────────

export function Card({
  children,
  onClick,
  padding = 16,
  className = '',
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  padding?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={{ padding, ...style }}
      className={`rounded-card bg-surface shadow-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <div className="h-px bg-line" style={{ marginLeft: inset }} />;
}

// ─── CatBadge (icône catégorie avec fond coloré) ───────────────

type Category = 'transport' | 'lodging' | 'food' | 'activity' | 'shopping' | 'other';

const CAT_TONES: Record<Category, { bg: string; fg: 'light' | 'dark' }> = {
  transport: { bg: '#B8DBD9', fg: 'dark' },
  lodging: { bg: '#2F4550', fg: 'light' },
  food: { bg: '#586F7C', fg: 'light' },
  activity: { bg: '#0C1A22', fg: 'light' },
  shopping: { bg: '#9CC9C5', fg: 'dark' },
  other: { bg: '#586F7C', fg: 'light' },
};

const ICON_TO_CAT: Record<CatIconName, Category> = {
  plane: 'transport',
  bed: 'lodging',
  fork: 'food',
  car: 'transport',
  ticket: 'activity',
  pin: 'activity',
  receipt: 'other',
};

export function CatBadge({
  name,
  size = 38,
}: {
  name: CatIconName;
  size?: number;
}) {
  const cat = ICON_TO_CAT[name];
  const tone = CAT_TONES[cat];
  return (
    <span
      style={{
        width: size,
        height: size,
        background: tone.bg,
        color: tone.fg === 'light' ? '#fff' : '#0C1A22',
      }}
      className="inline-flex flex-shrink-0 items-center justify-center rounded-[12px]"
    >
      <CatIcon name={name} size={size * 0.5} />
    </span>
  );
}

// API category enum (Prisma) → icon name
export function categoryToIcon(category: string): CatIconName {
  switch (category) {
    case 'TRANSPORT':
      return 'car';
    case 'LODGING':
      return 'bed';
    case 'RESTAURANT':
      return 'fork';
    case 'ACTIVITY':
      return 'ticket';
    case 'OTHER':
    default:
      return 'receipt';
  }
}

// ─── RoundBtn (header) ─────────────────────────────────────────

export function RoundBtn({
  children,
  dot = false,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  dot?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-btn border border-line2 bg-surface text-ink hover:bg-bg"
    >
      {children}
      {dot ? (
        <span
          className="absolute h-[7px] w-[7px] rounded-full bg-neg"
          style={{ top: 9, right: 10, boxShadow: '0 0 0 2px #FFFFFF' }}
        />
      ) : null}
    </button>
  );
}

// ─── Label uppercase ───────────────────────────────────────────

export function Label({ children, noMargin = false }: { children: ReactNode; noMargin?: boolean }) {
  return (
    <div
      className={`label-up-bold ${noMargin ? '' : 'mb-2'}`}
      style={{ letterSpacing: '0.08em' }}
    >
      {children}
    </div>
  );
}

// ─── Cover gradients (déterministes par tripId) ────────────────

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #2F4550 0%, #586F7C 60%, #B8DBD9 100%)',
  'linear-gradient(160deg, #0C1A22 0%, #2F4550 55%, #586F7C 100%)',
  'linear-gradient(135deg, #586F7C 0%, #B8DBD9 100%)',
  'linear-gradient(140deg, #0C1A22 0%, #586F7C 50%, #9CC9C5 100%)',
  'linear-gradient(125deg, #2F4550 0%, #9CC9C5 100%)',
];

export function coverFromId(tripId: string): string {
  let hash = 0;
  for (let i = 0; i < tripId.length; i++) hash = (hash * 31 + tripId.charCodeAt(i)) | 0;
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length]!;
}

// ─── DotGrid + Skyline overlays SVG ────────────────────────────

export function DotGridOverlay({ opacity = 0.18 }: { opacity?: number }) {
  return (
    <svg className="pointer-events-none absolute inset-0" width="100%" height="100%" style={{ opacity }}>
      <defs>
        <pattern id="dotgrid" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="#fff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
  );
}

export function SkylineOverlay({ opacity = 0.32, height = 60 }: { opacity?: number; height?: number }) {
  return (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className="pointer-events-none absolute bottom-0 left-0 w-full"
      style={{ height, opacity }}
    >
      <path
        d="M0,60 L0,40 L40,28 L60,38 L100,18 L140,32 L180,22 L220,30 L260,14 L300,28 L340,20 L380,32 L400,28 L400,60 Z"
        fill="#0C1A22"
      />
    </svg>
  );
}
