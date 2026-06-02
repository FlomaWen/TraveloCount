import { Prisma } from '@prisma/client';

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function computeUserBalance(
  expenses: { amount: Prisma.Decimal; payerId: string; shares: { userId: string; amount: Prisma.Decimal }[] }[],
  userId: string,
  confirmedSettlements: { fromUserId: string; toUserId: string; amount: Prisma.Decimal }[] = [],
): number {
  let balance = 0;
  for (const exp of expenses) {
    if (exp.payerId === userId) balance += Number(exp.amount);
    const myShare = exp.shares.find((s) => s.userId === userId);
    if (myShare) balance -= Number(myShare.amount);
  }
  for (const s of confirmedSettlements) {
    if (s.fromUserId === userId) balance += Number(s.amount);
    if (s.toUserId === userId) balance -= Number(s.amount);
  }
  return Math.round(balance * 100) / 100;
}

export type TripStatus = 'IN_PROGRESS' | 'UPCOMING' | 'PAST' | 'UNDATED';

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setUTCHours(23, 59, 59, 999);
  return r;
}

export function computeStatus(start: Date | null, end: Date | null, now: Date): TripStatus {
  if (!start || !end) return 'UNDATED';
  if (now < start) return 'UPCOMING';
  if (now > endOfDay(end)) return 'PAST';
  return 'IN_PROGRESS';
}

export function computeDayNumber(start: Date | null, end: Date | null, now: Date): number | null {
  if (!start || !end || now < start || now > endOfDay(end)) return null;
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
  return days;
}

export function computeTotalDays(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  return Math.floor((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
}

export function mimeToExt(mime: string): string {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '';
}

export function extToMime(ext: string): string {
  const e = ext.toLowerCase();
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.png') return 'image/png';
  if (e === '.webp') return 'image/webp';
  return 'application/octet-stream';
}
