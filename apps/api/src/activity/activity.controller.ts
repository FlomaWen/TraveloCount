import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { ActivityService } from './activity.service';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
    @Query('since') since?: string,
  ) {
    const lim = limit ? Math.min(Math.max(Number(limit), 1), 100) : 50;
    const sinceDate = since ? new Date(since) : undefined;
    return this.activity.listForUser(user.id, lim, sinceDate);
  }
}
