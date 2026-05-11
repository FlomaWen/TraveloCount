import { Module } from '@nestjs/common';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from './itinerary.service';
import { GeocodeService } from './geocode.service';

@Module({
  controllers: [ItineraryController],
  providers: [ItineraryService, GeocodeService],
})
export class ItineraryModule {}
