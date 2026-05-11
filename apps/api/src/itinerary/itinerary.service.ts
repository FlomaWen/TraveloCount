import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryItemDto } from './dto/create-item.dto';

@Injectable()
export class ItineraryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tripId: string, dto: CreateItineraryItemDto) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this trip');

    const item = await this.prisma.itineraryItem.create({
      data: {
        tripId,
        day: dto.day,
        time: dto.time,
        type: dto.type,
        title: dto.title,
        details: dto.details,
        address: dto.address,
        lat: dto.lat,
        lng: dto.lng,
      },
    });

    await this.prisma.activityEvent.create({
      data: {
        tripId,
        userId,
        type: ActivityType.ITINERARY_ADDED,
        payload: { itemId: item.id, title: item.title, day: item.day },
      },
    });

    return item;
  }

  async list(userId: string, tripId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this trip');

    return this.prisma.itineraryItem.findMany({
      where: { tripId },
      orderBy: [{ day: 'asc' }, { time: 'asc' }],
    });
  }

  async remove(userId: string, tripId: string, itemId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this trip');
    const item = await this.prisma.itineraryItem.findUnique({ where: { id: itemId } });
    if (!item || item.tripId !== tripId) throw new NotFoundException('Item not found');
    await this.prisma.itineraryItem.delete({ where: { id: itemId } });
    return { ok: true };
  }
}
