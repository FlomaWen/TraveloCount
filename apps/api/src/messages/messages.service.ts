import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMember(userId: string, tripId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) {
      const tripExists = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { id: true } });
      if (!tripExists) throw new NotFoundException('Trip not found');
      throw new ForbiddenException('Not a member of this trip');
    }
  }

  async list(userId: string, tripId: string, limit = 50, before?: string) {
    await this.assertMember(userId, tripId);
    const messages = await this.prisma.message.findMany({
      where: {
        tripId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return messages.reverse().map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      author: m.author,
    }));
  }

  async create(userId: string, tripId: string, dto: CreateMessageDto) {
    await this.assertMember(userId, tripId);
    const trimmed = dto.content.trim();
    if (trimmed.length === 0) {
      throw new ForbiddenException('Empty message');
    }
    const message = await this.prisma.message.create({
      data: { tripId, authorId: userId, content: trimmed },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    await this.prisma.activityEvent.create({
      data: {
        tripId,
        userId,
        type: ActivityType.MESSAGE_POSTED,
        payload: { messageId: message.id, preview: trimmed.slice(0, 80) },
      },
    });
    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      author: message.author,
    };
  }
}
