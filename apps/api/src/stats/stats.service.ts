import { ForbiddenException, Injectable } from '@nestjs/common';
import { ExpenseCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CategoryBreakdown {
  category: ExpenseCategory;
  value: number;
}

export interface DailyBreakdown {
  date: string;
  value: number;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async tripStats(userId: string, tripId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this trip');

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { currency: true, budget: true, startDate: true, endDate: true, title: true },
    });
    if (!trip) throw new ForbiddenException('Trip not found');

    const expenses = await this.prisma.expense.findMany({
      where: { tripId },
      select: { amount: true, category: true, date: true, payerId: true },
    });
    const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

    const byCategory = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
    }
    const categories: CategoryBreakdown[] = Array.from(byCategory.entries())
      .map(([category, value]) => ({ category, value: round(value) }))
      .sort((a, b) => b.value - a.value);

    const byDay = new Map<string, number>();
    for (const e of expenses) {
      const key = new Date(e.date).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + Number(e.amount));
    }
    const daily: DailyBreakdown[] = Array.from(byDay.entries())
      .map(([date, value]) => ({ date, value: round(value) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top payer
    const byPayer = new Map<string, number>();
    for (const e of expenses) {
      byPayer.set(e.payerId, (byPayer.get(e.payerId) ?? 0) + Number(e.amount));
    }
    let topPayer: { userId: string; name: string; advanced: number } | null = null;
    if (byPayer.size > 0) {
      const [topId, topAmount] = Array.from(byPayer.entries()).sort((a, b) => b[1] - a[1])[0]!;
      const user = await this.prisma.user.findUnique({
        where: { id: topId },
        select: { id: true, name: true },
      });
      if (user) topPayer = { userId: user.id, name: user.name, advanced: round(topAmount) };
    }

    const avg = expenses.length > 0 ? round(total / expenses.length) : 0;

    return {
      tripTitle: trip.title,
      currency: trip.currency,
      total: round(total),
      budget: trip.budget ? Number(trip.budget) : null,
      categories,
      daily,
      topPayer,
      avg,
      expenseCount: expenses.length,
    };
  }

  async globalStats(userId: string) {
    const memberships = await this.prisma.tripMember.findMany({
      where: { userId },
      select: { tripId: true },
    });
    const tripIds = memberships.map((m) => m.tripId);
    if (tripIds.length === 0) {
      return { total: 0, categories: [], daily: [], topPayer: null, avg: 0, expenseCount: 0, tripCount: 0 };
    }

    const expenses = await this.prisma.expense.findMany({
      where: { tripId: { in: tripIds } },
      select: { amount: true, category: true, date: true, payerId: true },
    });
    const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

    const byCategory = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
    }
    const categories: CategoryBreakdown[] = Array.from(byCategory.entries())
      .map(([category, value]) => ({ category, value: round(value) }))
      .sort((a, b) => b.value - a.value);

    return {
      total: round(total),
      categories,
      tripCount: tripIds.length,
      expenseCount: expenses.length,
    };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
