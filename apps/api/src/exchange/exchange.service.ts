import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CACHE_TTL_MS = 24 * 3600 * 1000;

@Injectable()
export class ExchangeService {
  constructor(private readonly prisma: PrismaService) {}

  async getRate(base: string, quote: string): Promise<number> {
    if (base === quote) return 1;

    const cached = await this.prisma.exchangeRate.findUnique({
      where: { base_quote: { base, quote } },
    });
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
      return Number(cached.rate);
    }

    const rate = await this.fetchRate(base, quote);
    await this.prisma.exchangeRate.upsert({
      where: { base_quote: { base, quote } },
      update: { rate: rate.toString(), fetchedAt: new Date() },
      create: { base, quote, rate: rate.toString() },
    });
    return rate;
  }

  private async fetchRate(base: string, quote: string): Promise<number> {
    const url = `https://api.frankfurter.app/latest?from=${base}&to=${quote}`;
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok) {
      throw new ServiceUnavailableException(`Exchange rate ${base}->${quote} unavailable`);
    }
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.[quote];
    if (typeof rate !== 'number') {
      throw new ServiceUnavailableException(`Exchange rate ${base}->${quote} not in response`);
    }
    return rate;
  }
}
