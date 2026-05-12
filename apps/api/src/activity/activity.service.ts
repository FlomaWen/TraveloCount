import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, limit = 50, since?: Date) {
    const [memberships, user] = await Promise.all([
      this.prisma.tripMember.findMany({
        where: { userId },
        select: { tripId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { activityFilter: true },
      }),
    ]);
    const tripIds = memberships.map((m) => m.tripId);
    if (tripIds.length === 0) return [];

    const events = await this.prisma.activityEvent.findMany({
      where: {
        tripId: { in: tripIds },
        ...(user?.activityFilter && user.activityFilter.length > 0
          ? { type: { in: user.activityFilter } }
          : {}),
        ...(since ? { createdAt: { gt: since } } : {}),
      },
      include: {
        user: { select: { id: true, name: true } },
        trip: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return events.map((e) => ({
      id: e.id,
      type: e.type,
      payload: e.payload,
      createdAt: e.createdAt,
      user: e.user,
      trip: e.trip,
    }));
  }
}
