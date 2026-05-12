import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatGateway } from './chat.gateway';

@Controller('trips/:tripId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messages: MessagesService,
    private readonly chat: ChatGateway,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const lim = limit ? Math.min(Math.max(Number(limit), 1), 200) : 50;
    return this.messages.list(user.id, tripId, lim, before);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateMessageDto,
  ) {
    const message = await this.messages.create(user.id, tripId, dto);
    this.chat.broadcastNew(tripId, message);
    return message;
  }
}
