'use client';

import { createContext, useContext } from 'react';

export interface TripMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: 'ADMIN' | 'MEMBER';
}

export interface TripDetail {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  ambiance: string | null;
  currency: string;
  defaultSplitMethod: 'EQUAL' | 'SHARES' | 'EXACT';
  budget: number | null;
  totalSpent: number;
  userBalance: number;
  status: 'IN_PROGRESS' | 'UPCOMING' | 'PAST' | 'UNDATED';
  dayNumber: number | null;
  totalDays: number | null;
  members: TripMember[];
}

export interface TripContextValue {
  trip: TripDetail;
  refresh: () => void;
}

export const TripContext = createContext<TripContextValue | null>(null);

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within TripContext');
  return ctx;
}
