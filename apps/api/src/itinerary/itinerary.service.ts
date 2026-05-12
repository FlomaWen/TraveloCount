import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, TripRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryItemDto } from './dto/create-item.dto';
import { UpdateItineraryItemDto } from './dto/update-item.dto';

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

  async update(userId: string, tripId: string, itemId: string, dto: UpdateItineraryItemDto) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this trip');
    if (member.role !== TripRole.ADMIN) {
      throw new ForbiddenException('Only admins can edit itinerary items');
    }
    const item = await this.prisma.itineraryItem.findUnique({ where: { id: itemId } });
    if (!item || item.tripId !== tripId) throw new NotFoundException('Item not found');

    return this.prisma.itineraryItem.update({
      where: { id: itemId },
      data: {
        ...(dto.day !== undefined ? { day: dto.day } : {}),
        ...(dto.time !== undefined ? { time: dto.time } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.details !== undefined ? { details: dto.details } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.lat !== undefined ? { lat: dto.lat } : {}),
        ...(dto.lng !== undefined ? { lng: dto.lng } : {}),
      },
    });
  }

  async remove(userId: string, tripId: string, itemId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this trip');
    if (member.role !== TripRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete itinerary items');
    }
    const item = await this.prisma.itineraryItem.findUnique({ where: { id: itemId } });
    if (!item || item.tripId !== tripId) throw new NotFoundException('Item not found');
    await this.prisma.itineraryItem.delete({ where: { id: itemId } });
    return { ok: true };
  }
}
