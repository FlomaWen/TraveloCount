import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripCoverController {
  constructor(private readonly trips: TripsService) {}

  @Get(':id/cover')
  async getCover(@Param('id') id: string, @Res() res: Response) {
    const { stream, mimeType } = await this.trips.getCoverStream(id);
    res.setHeader('content-type', mimeType);
    res.setHeader('cache-control', 'public, max-age=86400');
    stream.pipe(res);
  }
}
