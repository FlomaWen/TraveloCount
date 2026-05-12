import { Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { SettlementsService } from './settlements.service';

@Controller('trips/:tripId/settlements')
@UseGuards(JwtAuthGuard)
export class SettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('tripId') tripId: string) {
    return this.settlements.list(user.id, tripId);
  }

  @Post('mark-mine-sent')
  markMineAsSent(@CurrentUser() user: AuthenticatedUser, @Param('tripId') tripId: string) {
    return this.settlements.markMineAsSent(user.id, tripId);
  }

  @Patch(':id/confirm')
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ) {
    return this.settlements.confirm(user.id, tripId, id);
  }

  @Patch(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ) {
    return this.settlements.reject(user.id, tripId, id);
  }

  @Delete(':id')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ) {
    return this.settlements.cancel(user.id, tripId, id);
  }
}
