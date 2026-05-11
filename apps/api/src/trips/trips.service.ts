import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma, TripRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { computeBalances, computeSettlements } from './balances';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTripDto) {
    if (dto.startDate && dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be after startDate');
    }

    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          title: dto.title,
          destination: dto.destination,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          ambiance: dto.ambiance,
          currency: dto.currency ?? 'EUR',
          budget: dto.budget?.toString(),
          members: {
            create: { userId, role: TripRole.ADMIN },
          },
        },
        include: { members: { include: { user: true } } },
      });

      await tx.activityEvent.create({
        data: {
          tripId: trip.id,
          userId,
          type: ActivityType.TRIP_CREATED,
          payload: { title: trip.title },
        },
      });

      return trip;
    });
  }

  async listForUser(userId: string) {
    const trips = await this.prisma.trip.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        expenses: { select: { amount: true, payerId: true, shares: true } },
      },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    });

    const now = new Date();
    return trips.map((trip) => {
      const status = computeStatus(trip.startDate, trip.endDate, now);
      const totalSpent = sum(trip.expenses.map((e) => Number(e.amount)));
      const userBalance = computeUserBalance(trip.expenses, userId);
      return {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        ambiance: trip.ambiance,
        currency: trip.currency,
        budget: trip.budget ? Number(trip.budget) : null,
        totalSpent,
        userBalance,
        status,
        members: trip.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
          role: m.role,
        })),
      };
    });
  }

  async findOneForUser(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } } },
        expenses: { select: { amount: true, payerId: true, shares: true } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    const isMember = trip.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Not a member of this trip');

    const now = new Date();
    const totalSpent = sum(trip.expenses.map((e) => Number(e.amount)));
    const userBalance = computeUserBalance(trip.expenses, userId);

    return {
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      ambiance: trip.ambiance,
      currency: trip.currency,
      budget: trip.budget ? Number(trip.budget) : null,
      totalSpent,
      userBalance,
      status: computeStatus(trip.startDate, trip.endDate, now),
      dayNumber: computeDayNumber(trip.startDate, trip.endDate, now),
      totalDays: computeTotalDays(trip.startDate, trip.endDate),
      members: trip.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
      })),
    };
  }

  async updateMemberRole(
    actorId: string,
    tripId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const actor = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: actorId } },
    });
    if (!actor) throw new NotFoundException('Trip not found');
    if (actor.role !== TripRole.ADMIN) {
      throw new ForbiddenException('Only admins can change roles');
    }

    const target = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('Member not found');

    if (target.role === dto.role) return target;

    if (target.role === TripRole.ADMIN && dto.role === TripRole.MEMBER) {
      const adminCount = await this.prisma.tripMember.count({
        where: { tripId, role: TripRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last admin');
      }
    }

    return this.prisma.tripMember.update({
      where: { tripId_userId: { tripId, userId: targetUserId } },
      data: { role: dto.role },
    });
  }

  async getBalances(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        currency: true,
        members: { include: { user: { select: { id: true, name: true } } } },
        expenses: { select: { payerId: true, amount: true, shares: true } },
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

    const balances = computeBalances(memberIds, expenses);
    const settlements = computeSettlements(balances);
    const memberMap = new Map(trip.members.map((m) => [m.userId, m.user]));

    return {
      currency: trip.currency,
      balances: balances.map((b) => ({
        user: memberMap.get(b.userId),
        amount: b.amount,
      })),
      settlements: settlements.map((s) => ({
        from: memberMap.get(s.fromUserId),
        to: memberMap.get(s.toUserId),
        amount: s.amount,
      })),
    };
  }
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function computeUserBalance(
  expenses: { amount: Prisma.Decimal; payerId: string; shares: { userId: string; amount: Prisma.Decimal }[] }[],
  userId: string,
): number {
  let balance = 0;
  for (const exp of expenses) {
    if (exp.payerId === userId) balance += Number(exp.amount);
    const myShare = exp.shares.find((s) => s.userId === userId);
    if (myShare) balance -= Number(myShare.amount);
  }
  return Math.round(balance * 100) / 100;
}

type TripStatus = 'IN_PROGRESS' | 'UPCOMING' | 'PAST' | 'UNDATED';

function computeStatus(start: Date | null, end: Date | null, now: Date): TripStatus {
  if (!start || !end) return 'UNDATED';
  if (now < start) return 'UPCOMING';
  if (now > end) return 'PAST';
  return 'IN_PROGRESS';
}

function computeDayNumber(start: Date | null, end: Date | null, now: Date): number | null {
  if (!start || !end || now < start || now > end) return null;
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
  return days;
}

function computeTotalDays(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  return Math.floor((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
}
