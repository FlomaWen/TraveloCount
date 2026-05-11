import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityType, TripRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, tripId: string, dto: CreateInviteDto) {
    const membership = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!membership) throw new NotFoundException('Trip not found');
    if (membership.role !== TripRole.ADMIN) {
      throw new ForbiddenException('Only admins can create invites');
    }

    const ttlHours = dto.ttlHours ?? 72;
    const token = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    const invite = await this.prisma.invite.create({
      data: {
        tripId,
        createdBy: userId,
        token,
        email: dto.email,
        expiresAt,
      },
      select: { token: true, expiresAt: true, email: true },
    });

    if (dto.email) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        select: { title: true },
      });
      const inviter = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const baseUrl = this.config.get<string>('NEXTAUTH_URL') ?? 'http://localhost:3000';
      const inviteUrl = `${baseUrl}/j/${token}`;
      void this.mail.sendInvite({
        to: dto.email,
        tripTitle: trip?.title ?? 'voyage',
        inviteUrl,
        inviterName: inviter?.name ?? 'Un ami',
      });
    }

    return invite;
  }

  async preview(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            destination: true,
            startDate: true,
            endDate: true,
            members: { select: { userId: true } },
          },
        },
      },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.usedAt) throw new GoneException('Invite already used');
    if (invite.expiresAt < new Date()) throw new GoneException('Invite expired');

    return {
      trip: {
        id: invite.trip.id,
        title: invite.trip.title,
        destination: invite.trip.destination,
        startDate: invite.trip.startDate,
        endDate: invite.trip.endDate,
        memberCount: invite.trip.members.length,
      },
      expiresAt: invite.expiresAt,
    };
  }

  async accept(userId: string, token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: { trip: { select: { id: true, members: { select: { userId: true } } } } },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.usedAt) throw new GoneException('Invite already used');
    if (invite.expiresAt < new Date()) throw new GoneException('Invite expired');

    const alreadyMember = invite.trip.members.some((m) => m.userId === userId);
    if (alreadyMember) {
      return { tripId: invite.trip.id, alreadyMember: true };
    }

    await this.prisma.$transaction([
      this.prisma.tripMember.create({
        data: { tripId: invite.trip.id, userId, role: TripRole.MEMBER },
      }),
      this.prisma.invite.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
      this.prisma.activityEvent.create({
        data: {
          tripId: invite.trip.id,
          userId,
          type: ActivityType.MEMBER_JOINED,
          payload: { via: 'invite' },
        },
      }),
    ]);

    return { tripId: invite.trip.id, alreadyMember: false };
  }
}
