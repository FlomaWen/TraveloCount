import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeBalances, computeSettlements } from '../trips/balances';

export interface TripDebtBreakdown {
  tripId: string;
  tripTitle: string;
  currency: string;
  amount: number; // positive = they owe me, negative = I owe them
}

export interface PersonSummary {
  user: { id: string; name: string; avatarUrl: string | null };
  byCurrency: { currency: string; amount: number }[]; // signed totals
  trips: TripDebtBreakdown[];
}

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async summaryForUser(userId: string): Promise<PersonSummary[]> {
    const trips = await this.prisma.trip.findMany({
      where: { members: { some: { userId } } },
      select: {
        id: true,
        title: true,
        currency: true,
        members: {
          select: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        expenses: {
          select: {
            payerId: true,
            amount: true,
            shares: { select: { userId: true, amount: true } },
          },
        },
      },
    });

    // key = otherUserId
    const aggregate = new Map<
      string,
      {
        user: { id: string; name: string; avatarUrl: string | null };
        byCurrency: Map<string, number>;
        trips: TripDebtBreakdown[];
      }
    >();

    for (const trip of trips) {
      const memberIds = trip.members.map((m) => m.user.id);
      const memberMap = new Map(trip.members.map((m) => [m.user.id, m.user]));
      const expenses = trip.expenses.map((e) => ({
        payerId: e.payerId,
        amount: Number(e.amount),
        shares: e.shares.map((s) => ({ userId: s.userId, amount: Number(s.amount) })),
      }));
      const balances = computeBalances(memberIds, expenses);
      const settlements = computeSettlements(balances);

      for (const s of settlements) {
        let otherUserId: string | null = null;
        let amountForMe = 0; // positive if they owe me, negative if I owe them
        if (s.fromUserId === userId) {
          otherUserId = s.toUserId;
          amountForMe = -s.amount;
        } else if (s.toUserId === userId) {
          otherUserId = s.fromUserId;
          amountForMe = s.amount;
        }
        if (!otherUserId) continue;
        const otherUser = memberMap.get(otherUserId);
        if (!otherUser) continue;

        let entry = aggregate.get(otherUserId);
        if (!entry) {
          entry = {
            user: otherUser,
            byCurrency: new Map(),
            trips: [],
          };
          aggregate.set(otherUserId, entry);
        }
        entry.byCurrency.set(
          trip.currency,
          (entry.byCurrency.get(trip.currency) ?? 0) + amountForMe,
        );
        entry.trips.push({
          tripId: trip.id,
          tripTitle: trip.title,
          currency: trip.currency,
          amount: amountForMe,
        });
      }
    }

    return Array.from(aggregate.values()).map((e) => ({
      user: e.user,
      byCurrency: Array.from(e.byCurrency.entries()).map(([currency, amount]) => ({
        currency,
        amount: Math.round(amount * 100) / 100,
      })),
      trips: e.trips,
    }));
  }
}
