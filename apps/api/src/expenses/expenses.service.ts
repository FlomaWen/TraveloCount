import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeService } from '../exchange/exchange.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { computeShares } from './split';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchange: ExchangeService,
  ) {}

  async create(userId: string, tripId: string, dto: CreateExpenseDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, currency: true, members: { select: { userId: true } } },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    const memberIds = new Set(trip.members.map((m) => m.userId));
    if (!memberIds.has(userId)) throw new ForbiddenException('Not a member of this trip');
    if (!memberIds.has(dto.payerId)) {
      throw new BadRequestException('Payer is not a member of this trip');
    }
    for (const p of dto.participants) {
      if (!memberIds.has(p.userId)) {
        throw new BadRequestException(`Participant ${p.userId} is not a member of this trip`);
      }
    }

    const inputCurrency = dto.currency ?? trip.currency;
    let amountInTripCurrency = dto.amount;
    let amountOriginal: number | null = null;
    let currencyOriginal: string | null = null;
    let exchangeRate: number | null = null;

    if (inputCurrency !== trip.currency) {
      exchangeRate = await this.exchange.getRate(inputCurrency, trip.currency);
      amountOriginal = dto.amount;
      currencyOriginal = inputCurrency;
      amountInTripCurrency = Math.round(dto.amount * exchangeRate * 100) / 100;
    }

    const shares = computeShares(dto.splitMethod, amountInTripCurrency, dto.participants);

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          tripId,
          payerId: dto.payerId,
          label: dto.label,
          category: dto.category,
          amount: amountInTripCurrency.toString(),
          currency: trip.currency,
          amountOriginal: amountOriginal?.toString(),
          currencyOriginal,
          exchangeRate: exchangeRate?.toString(),
          date: new Date(dto.date),
          splitMethod: dto.splitMethod,
          shares: {
            create: shares.map((s) => ({ userId: s.userId, amount: s.amount.toString() })),
          },
        },
        include: { shares: true },
      });

      await tx.activityEvent.create({
        data: {
          tripId,
          userId,
          type: ActivityType.EXPENSE_ADDED,
          payload: {
            expenseId: expense.id,
            label: expense.label,
            amount: Number(expense.amount),
            currency: expense.currency,
            payerId: expense.payerId,
          },
        },
      });

      return expense;
    });
  }

  async listForTrip(userId: string, tripId: string) {
    const membership = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this trip');

    const expenses = await this.prisma.expense.findMany({
      where: { tripId },
      include: {
        payer: { select: { id: true, name: true } },
        shares: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    return expenses.map((e) => ({
      id: e.id,
      label: e.label,
      category: e.category,
      amount: Number(e.amount),
      currency: e.currency,
      amountOriginal: e.amountOriginal ? Number(e.amountOriginal) : null,
      currencyOriginal: e.currencyOriginal,
      date: e.date,
      splitMethod: e.splitMethod,
      payer: e.payer,
      participantCount: e.shares.length,
      myShare: Number(e.shares.find((s) => s.userId === userId)?.amount ?? 0),
    }));
  }
}
