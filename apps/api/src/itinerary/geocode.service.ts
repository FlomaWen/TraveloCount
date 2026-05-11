import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
}

export interface GeocodeMatch {
  label: string;
  lat: number;
  lng: number;
  type?: string;
}

@Injectable()
export class GeocodeService {
  async search(query: string): Promise<GeocodeMatch[]> {
    if (query.trim().length < 3) {
      throw new BadRequestException('Query must be at least 3 characters');
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TraveloCount/0.1 (dev)' },
    }).catch(() => null);
    if (!res || !res.ok) throw new ServiceUnavailableException('Geocoding service unavailable');
    const data = (await res.json()) as NominatimResult[];
    return data.map((d) => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      type: d.type,
    }));
  }
}
