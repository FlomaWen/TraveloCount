import { SplitMethod } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

export interface ParticipantInput {
  userId: string;
  value?: number;
}

export interface Share {
  userId: string;
  amount: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function computeShares(
  method: SplitMethod,
  total: number,
  participants: ParticipantInput[],
): Share[] {
  if (participants.length === 0) {
    throw new BadRequestException('At least one participant required');
  }

  if (method === SplitMethod.EQUAL) {
    const base = Math.floor((total / participants.length) * 100) / 100;
    const shares = participants.map((p) => ({ userId: p.userId, amount: base }));
    const drift = round(total - base * participants.length);
    if (drift !== 0 && shares[0]) shares[0].amount = round(shares[0].amount + drift);
    return shares;
  }

  if (method === SplitMethod.EXACT) {
    const shares = participants.map((p) => {
      if (p.value === undefined) throw new BadRequestException('EXACT split requires value per participant');
      return { userId: p.userId, amount: round(p.value) };
    });
    const sum = round(shares.reduce((a, s) => a + s.amount, 0));
    if (sum !== round(total)) {
      throw new BadRequestException(`Sum of exact shares (${sum}) must equal total (${total})`);
    }
    return shares;
  }

  if (method === SplitMethod.SHARES) {
    const weights = participants.map((p) => {
      if (p.value === undefined || p.value <= 0) {
        throw new BadRequestException('SHARES split requires positive value per participant');
      }
      return p.value;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const shares = participants.map((p, i) => ({
      userId: p.userId,
      amount: Math.floor(((total * weights[i]!) / totalWeight) * 100) / 100,
    }));
    const drift = round(total - shares.reduce((a, s) => a + s.amount, 0));
    if (drift !== 0 && shares[0]) shares[0].amount = round(shares[0].amount + drift);
    return shares;
  }

  throw new BadRequestException(`Unknown split method: ${method}`);
}
