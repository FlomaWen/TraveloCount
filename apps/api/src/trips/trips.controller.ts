import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTripDto) {
    return this.trips.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.trips.listForUser(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.trips.findOneForUser(user.id, id);
  }

  @Patch(':id/members/:userId')
  updateMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') tripId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.trips.updateMemberRole(user.id, tripId, targetUserId, dto);
  }

  @Get(':id/balances')
  getBalances(@CurrentUser() user: AuthenticatedUser, @Param('id') tripId: string) {
    return this.trips.getBalances(user.id, tripId);
  }
}
