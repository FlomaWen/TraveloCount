import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller()
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Post('trips/:tripId/invites')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invites.create(user.id, tripId, dto);
  }

  @Get('invites/:token')
  preview(@Param('token') token: string) {
    return this.invites.preview(token);
  }

  @Post('invites/:token/accept')
  @UseGuards(JwtAuthGuard)
  accept(@CurrentUser() user: AuthenticatedUser, @Param('token') token: string) {
    return this.invites.accept(user.id, token);
  }
}
