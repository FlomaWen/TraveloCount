import type { ReactElement, SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'fill'> {
  size?: number;
  sw?: number;
  fill?: string;
}

function Icon({ size = 22, sw = 1.7, fill = 'none', children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IcPlus = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const IcArrowL = (p: IconProps) => <Icon {...p}><path d="M15 6l-6 6 6 6" /></Icon>;
export const IcArrowR = (p: IconProps) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>;
export const IcArrowUp = (p: IconProps) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Icon>;
export const IcArrowDn = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12l7 7 7-7" /></Icon>;
export const IcCheck = (p: IconProps) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;
export const IcX = (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>;
export const IcSearch = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Icon>;
export const IcBell = (p: IconProps) => <Icon {...p}><path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 004 0" /></Icon>;
export const IcUser = (p: IconProps) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></Icon>;
export const IcUsers = (p: IconProps) => <Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" /><path d="M16 4.5a3.5 3.5 0 010 7M22 20c0-3-2-5-5-5.5" /></Icon>;
export const IcWallet = (p: IconProps) => <Icon {...p}><path d="M3 7c0-1.1.9-2 2-2h13a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path d="M16 13h3M3 9h18" /></Icon>;
export const IcReceipt = (p: IconProps) => <Icon {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6M9 16h4" /></Icon>;
export const IcCal = (p: IconProps) => <Icon {...p}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Icon>;
export const IcMap = (p: IconProps) => <Icon {...p}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></Icon>;
export const IcCompass = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-1.8 5.2-5.2 1.8 1.8-5.2 5.2-1.8z" /></Icon>;
export const IcChart = (p: IconProps) => <Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>;
export const IcSwap = (p: IconProps) => <Icon {...p}><path d="M7 4v14M7 4L3 8M7 4l4 4M17 20V6M17 20l-4-4M17 20l4-4" /></Icon>;
export const IcCar = (p: IconProps) => <Icon {...p}><path d="M5 17h14M5 17l-2-4 2-5h14l2 5-2 4M5 17v2M19 17v2" /><circle cx="8" cy="14.5" r="1.2" fill="currentColor" /><circle cx="16" cy="14.5" r="1.2" fill="currentColor" /></Icon>;
export const IcPlane = (p: IconProps) => <Icon {...p}><path d="M3 13l8-2 2-8 2 2-1 6 6-1 2 2-8 2-2 8-2-2 1-6-6 1-2-2z" /></Icon>;
export const IcBed = (p: IconProps) => <Icon {...p}><path d="M3 18v-7c0-1.1.9-2 2-2h14a2 2 0 012 2v7M3 14h18M3 18h18" /><path d="M7 9V6h4v3" /></Icon>;
export const IcFork = (p: IconProps) => <Icon {...p}><path d="M6 3v8a2 2 0 002 2v8M10 3v8a2 2 0 01-2 2M14 3c-1 0-2 2-2 4s1 4 2 4v9M14 3v9" /></Icon>;
export const IcTicket = (p: IconProps) => <Icon {...p}><path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 100-4V9z" /><path d="M12 8v2M12 14v2" /></Icon>;
export const IcCamera = (p: IconProps) => <Icon {...p}><path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /><circle cx="12" cy="13" r="3.5" /></Icon>;
export const IcMore = (p: IconProps) => <Icon {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></Icon>;
export const IcFilter = (p: IconProps) => <Icon {...p}><path d="M4 5h16M7 12h10M10 19h4" /></Icon>;
export const IcSparkle = (p: IconProps) => <Icon {...p}><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM19 15l.8 2 2 .8-2 .8L19 21l-.8-2-2-.8 2-.8.8-2z" /></Icon>;
export const IcPin = (p: IconProps) => <Icon {...p}><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" /></Icon>;
export const IcEdit = (p: IconProps) => <Icon {...p}><path d="M4 20h4l11-11-4-4L4 16v4z" /><path d="M14 6l4 4" /></Icon>;
export const IcHome = (p: IconProps) => <Icon {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></Icon>;

export type CatIconName = 'plane' | 'bed' | 'fork' | 'car' | 'ticket' | 'pin' | 'receipt';

export function CatIcon({ name, size = 18, ...rest }: { name: CatIconName; size?: number } & Omit<IconProps, 'size'>) {
  const map: Record<CatIconName, (p: IconProps) => ReactElement> = {
    plane: IcPlane,
    bed: IcBed,
    fork: IcFork,
    car: IcCar,
    ticket: IcTicket,
    pin: IcPin,
    receipt: IcReceipt,
  };
  const C = map[name];
  return <C size={size} sw={1.8} {...rest} />;
}
