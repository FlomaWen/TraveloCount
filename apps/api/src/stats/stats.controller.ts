import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { StatsService } from './stats.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('trips/:tripId/stats')
  trip(@CurrentUser() user: AuthenticatedUser, @Param('tripId') tripId: string) {
    return this.stats.tripStats(user.id, tripId);
  }

  @Get('stats')
  global(@CurrentUser() user: AuthenticatedUser) {
    return this.stats.globalStats(user.id);
  }
}
