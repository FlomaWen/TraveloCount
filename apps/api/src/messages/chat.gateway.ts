import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

interface AuthedSocket extends Socket {
  data: { userId?: string };
}

@WebSocketGateway({
  path: '/ws/chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(socket: AuthedSocket) {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      this.extractFromHeader(socket.handshake.headers.authorization);
    if (!token) {
      socket.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      socket.data.userId = payload.sub;
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(_socket: AuthedSocket) {
    // no-op
  }

  @SubscribeMessage('join')
  async onJoin(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { tripId: string },
  ) {
    const userId = socket.data.userId;
    if (!userId || !data?.tripId) return { ok: false };
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId: data.tripId, userId } },
    });
    if (!member) return { ok: false };
    await socket.join(roomFor(data.tripId));
    return { ok: true };
  }

  @SubscribeMessage('leave')
  async onLeave(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { tripId: string },
  ) {
    if (data?.tripId) await socket.leave(roomFor(data.tripId));
    return { ok: true };
  }

  broadcastNew(tripId: string, message: unknown) {
    this.server.to(roomFor(tripId)).emit('message:new', message);
  }

  private extractFromHeader(header: string | undefined): string | null {
    if (!header) return null;
    const m = /^Bearer\s+(.+)$/i.exec(header);
    return m?.[1] ?? null;
  }
}

function roomFor(tripId: string): string {
  return `trip:${tripId}`;
}
