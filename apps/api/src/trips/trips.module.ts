import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripCoverController } from './trip-cover.controller';
import { TripsService } from './trips.service';

@Module({
  controllers: [TripsController, TripCoverController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
