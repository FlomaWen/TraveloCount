import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, SettlementStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeBalances, computeSettlements } from '../trips/balances';

interface CreateMineDto {
  fromUserId?: string;
}

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, tripId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this trip');
    const settlements = await this.prisma.settlement.findMany({
      where: { tripId },
      include: {
        from: { select: { id: true, name: true, avatarUrl: true } },
        to: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return settlements.map((s) => ({
      id: s.id,
      from: s.from,
      to: s.to,
      amount: Number(s.amount),
      currency: s.currency,
      status: s.status,
      createdAt: s.createdAt,
      confirmedAt: s.confirmedAt,
      cancelledAt: s.cancelledAt,
      rejectedAt: s.rejectedAt,
    }));
  }

  /**
   * Mark all my pending debts as sent. Creates PENDING settlements for every
   * debt I have in the optimized settlement plan.
   */
  async markMineAsSent(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        currency: true,
        members: { select: { userId: true } },
        expenses: { select: { payerId: true, amount: true, shares: true } },
        settlements: {
          where: { status: 'CONFIRMED' },
          select: { fromUserId: true, toUserId: true, amount: true },
        },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (!trip.members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('Not a member of this trip');
    }

    const memberIds = trip.members.map((m) => m.userId);
    const expenses = trip.expenses.map((e) => ({
      payerId: e.payerId,
      amount: Number(e.amount),
      shares: e.shares.map((s) => ({ userId: s.userId, amount: Number(s.amount) })),
    }));
    const confirmed = trip.settlements.map((s) => ({
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amount: Number(s.amount),
    }));

    const balances = computeBalances(memberIds, expenses, confirmed);
    const plan = computeSettlements(balances);
    const myDebts = plan.filter((p) => p.fromUserId === userId);
    if (myDebts.length === 0) {
      return { created: 0 };
    }

    // Skip if there is already a pending one for this from→to
    const existingPending = await this.prisma.settlement.findMany({
      where: { tripId, fromUserId: userId, status: SettlementStatus.PENDING },
      select: { toUserId: true },
    });
    const alreadyPendingTo = new Set(existingPending.map((s) => s.toUserId));

    const toCreate = myDebts.filter((d) => !alreadyPendingTo.has(d.toUserId));
    if (toCreate.length === 0) {
      return { created: 0 };
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        toCreate.map((d) =>
          tx.settlement.create({
            data: {
              tripId,
              fromUserId: userId,
              toUserId: d.toUserId,
              amount: d.amount.toString(),
              currency: trip.currency,
            },
          }),
        ),
      );
      for (const s of created) {
        await tx.activityEvent.create({
          data: {
            tripId,
            userId,
            type: ActivityType.SETTLEMENT_SENT,
            payload: {
              settlementId: s.id,
              toUserId: s.toUserId,
              amount: Number(s.amount),
              currency: s.currency,
            },
          },
        });
      }
      return { created: created.length };
    });
  }

  async confirm(userId: string, tripId: string, settlementId: string) {
    const s = await this.prisma.settlement.findUnique({ where: { id: settlementId } });
    if (!s || s.tripId !== tripId) throw new NotFoundException('Settlement not found');
    if (s.toUserId !== userId) throw new ForbiddenException('Only the receiver can confirm');
    if (s.status !== SettlementStatus.PENDING) {
      throw new BadRequestException(`Cannot confirm a ${s.status} settlement`);
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.settlement.update({
        where: { id: settlementId },
        data: { status: SettlementStatus.CONFIRMED, confirmedAt: new Date() },
      });
      await tx.activityEvent.create({
        data: {
          tripId,
          userId,
          type: ActivityType.SETTLEMENT_CONFIRMED,
          payload: {
            settlementId,
            fromUserId: s.fromUserId,
            amount: Number(s.amount),
            currency: s.currency,
          },
        },
      });
      return updated;
    });
  }

  async reject(userId: string, tripId: string, settlementId: string) {
    const s = await this.prisma.settlement.findUnique({ where: { id: settlementId } });
    if (!s || s.tripId !== tripId) throw new NotFoundException('Settlement not found');
    if (s.toUserId !== userId) throw new ForbiddenException('Only the receiver can reject');
    if (s.status !== SettlementStatus.PENDING) {
      throw new BadRequestException(`Cannot reject a ${s.status} settlement`);
    }
    return this.prisma.settlement.update({
      where: { id: settlementId },
      data: { status: SettlementStatus.REJECTED, rejectedAt: new Date() },
    });
  }

  async cancel(userId: string, tripId: string, settlementId: string) {
    const s = await this.prisma.settlement.findUnique({ where: { id: settlementId } });
    if (!s || s.tripId !== tripId) throw new NotFoundException('Settlement not found');
    if (s.fromUserId !== userId) throw new ForbiddenException('Only the sender can cancel');
    if (s.status !== SettlementStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel a ${s.status} settlement`);
    }
    return this.prisma.settlement.update({
      where: { id: settlementId },
      data: { status: SettlementStatus.CANCELLED, cancelledAt: new Date() },
    });
  }
}
