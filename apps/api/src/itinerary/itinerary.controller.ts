import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryItemDto } from './dto/create-item.dto';
import { UpdateItineraryItemDto } from './dto/update-item.dto';
import { GeocodeService } from './geocode.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ItineraryController {
  constructor(
    private readonly itinerary: ItineraryService,
    private readonly geocode: GeocodeService,
  ) {}

  @Get('trips/:tripId/itinerary')
  list(@CurrentUser() user: AuthenticatedUser, @Param('tripId') tripId: string) {
    return this.itinerary.list(user.id, tripId);
  }

  @Post('trips/:tripId/itinerary')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateItineraryItemDto,
  ) {
    return this.itinerary.create(user.id, tripId, dto);
  }

  @Patch('trips/:tripId/itinerary/:itemId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItineraryItemDto,
  ) {
    return this.itinerary.update(user.id, tripId, itemId, dto);
  }

  @Delete('trips/:tripId/itinerary/:itemId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.itinerary.remove(user.id, tripId, itemId);
  }

  @Get('geocode')
  search(@Query('q') q: string) {
    return this.geocode.search(q ?? '');
  }
}
