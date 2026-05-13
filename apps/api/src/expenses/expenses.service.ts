import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, TripRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeService } from '../exchange/exchange.service';
import { SettlementsService } from '../settlements/settlements.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { computeShares } from './split';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchange: ExchangeService,
    private readonly settlements: SettlementsService,
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

  async update(userId: string, tripId: string, expenseId: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        trip: {
          select: {
            id: true,
            currency: true,
            members: { select: { userId: true, role: true } },
          },
        },
      },
    });
    if (!expense || expense.tripId !== tripId) throw new NotFoundException('Expense not found');
    const myMembership = expense.trip.members.find((m) => m.userId === userId);
    if (!myMembership) throw new ForbiddenException('Not a member of this trip');
    const isAdmin = myMembership.role === TripRole.ADMIN;
    const isPayer = expense.payerId === userId;
    if (!isAdmin && !isPayer) {
      throw new ForbiddenException('Only the payer or an admin can edit this expense');
    }

    const memberIds = new Set(expense.trip.members.map((m) => m.userId));
    if (dto.payerId !== undefined && !memberIds.has(dto.payerId)) {
      throw new BadRequestException('Payer is not a member of this trip');
    }
    if (dto.participants !== undefined) {
      for (const p of dto.participants) {
        if (!memberIds.has(p.userId)) {
          throw new BadRequestException(`Participant ${p.userId} is not a member of this trip`);
        }
      }
    }

    const nextAmount = dto.amount ?? Number(expense.amountOriginal ?? expense.amount);
    const nextCurrency = dto.currency ?? expense.currencyOriginal ?? expense.currency;
    const tripCurrency = expense.trip.currency;
    let amountInTripCurrency = nextAmount;
    let amountOriginal: number | null = null;
    let currencyOriginal: string | null = null;
    let exchangeRate: number | null = null;
    if (nextCurrency !== tripCurrency) {
      exchangeRate = await this.exchange.getRate(nextCurrency, tripCurrency);
      amountOriginal = nextAmount;
      currencyOriginal = nextCurrency;
      amountInTripCurrency = Math.round(nextAmount * exchangeRate * 100) / 100;
    }

    const nextSplitMethod = dto.splitMethod ?? expense.splitMethod;
    const participants = dto.participants;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          ...(dto.label !== undefined ? { label: dto.label } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
          ...(dto.payerId !== undefined ? { payerId: dto.payerId } : {}),
          splitMethod: nextSplitMethod,
          amount: amountInTripCurrency.toString(),
          currency: tripCurrency,
          amountOriginal: amountOriginal !== null ? amountOriginal.toString() : null,
          currencyOriginal,
          exchangeRate: exchangeRate !== null ? exchangeRate.toString() : null,
        },
      });

      if (participants !== undefined) {
        const shares = computeShares(nextSplitMethod, amountInTripCurrency, participants);
        await tx.expenseShare.deleteMany({ where: { expenseId } });
        await tx.expenseShare.createMany({
          data: shares.map((s) => ({ expenseId, userId: s.userId, amount: s.amount.toString() })),
        });
      } else if (dto.amount !== undefined || dto.currency !== undefined) {
        // Re-split existing participants in EQUAL mode for the new amount
        const existingShares = await tx.expenseShare.findMany({ where: { expenseId } });
        const participants = existingShares.map((s) => ({ userId: s.userId }));
        const shares = computeShares('EQUAL', amountInTripCurrency, participants);
        await tx.expenseShare.deleteMany({ where: { expenseId } });
        await tx.expenseShare.createMany({
          data: shares.map((s) => ({ expenseId, userId: s.userId, amount: s.amount.toString() })),
        });
        await tx.expense.update({
          where: { id: expenseId },
          data: { splitMethod: 'EQUAL' },
        });
      }

      return tx.expense.findUnique({ where: { id: expenseId }, include: { shares: true } });
    });

    await this.settlements.reconcilePendingForTrip(tripId);
    return updated;
  }

  async remove(userId: string, tripId: string, expenseId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: { trip: { select: { members: { select: { userId: true, role: true } } } } },
    });
    if (!expense || expense.tripId !== tripId) throw new NotFoundException('Expense not found');
    const myMembership = expense.trip.members.find((m) => m.userId === userId);
    if (!myMembership) throw new ForbiddenException('Not a member of this trip');
    const isAdmin = myMembership.role === TripRole.ADMIN;
    const isPayer = expense.payerId === userId;
    if (!isAdmin && !isPayer) {
      throw new ForbiddenException('Only the payer or an admin can delete this expense');
    }
    await this.prisma.expense.delete({ where: { id: expenseId } });
    await this.settlements.reconcilePendingForTrip(tripId);
    return { deleted: true };
  }

  async getOne(userId: string, tripId: string, expenseId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        payer: { select: { id: true, name: true } },
        shares: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!expense || expense.tripId !== tripId) throw new NotFoundException('Expense not found');
    const membership = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this trip');
    return {
      id: expense.id,
      label: expense.label,
      category: expense.category,
      amount: Number(expense.amount),
      currency: expense.currency,
      amountOriginal: expense.amountOriginal ? Number(expense.amountOriginal) : null,
      currencyOriginal: expense.currencyOriginal,
      date: expense.date,
      splitMethod: expense.splitMethod,
      payer: expense.payer,
      shares: expense.shares.map((s) => ({
        userId: s.userId,
        name: s.user.name,
        amount: Number(s.amount),
      })),
    };
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
