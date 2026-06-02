export type SplitMethod = 'EQUAL' | 'SHARES' | 'EXACT';

export type TripAmbiance = 'CITY_BREAK' | 'MOUNTAIN' | 'BEACH' | 'ROAD_TRIP';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface TripDetail {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  ambiance: TripAmbiance | null;
  currency: string;
  budget: number | null;
  defaultSplitMethod: SplitMethod;
  hasCover: boolean;
  createdById: string | null;
  members: Member[];
}

export const AMBIANCE_LABELS: Record<TripAmbiance, string> = {
  CITY_BREAK: 'City break',
  MOUNTAIN: 'Montagne',
  BEACH: 'Plage',
  ROAD_TRIP: 'Road trip',
};

export const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollar US' },
  { code: 'GBP', symbol: '£', label: 'Livre Sterling' },
  { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse' },
  { code: 'JPY', symbol: '¥', label: 'Yen' },
  { code: 'CAD', symbol: 'CA$', label: 'Dollar Canadien' },
];

export const SPLIT_LABELS: Record<SplitMethod, string> = {
  EQUAL: 'Égal',
  SHARES: 'Parts',
  EXACT: 'Exact',
};

export function splitHint(method: SplitMethod): string {
  switch (method) {
    case 'EQUAL':
      return 'Partagé également entre tous';
    case 'SHARES':
      return 'Par parts pondérées';
    case 'EXACT':
      return 'Montants exacts par personne';
  }
}
