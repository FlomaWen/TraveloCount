export const CATEGORIES = [
  { value: 'TRANSPORT', label: 'Transport', icon: 'car' as const },
  { value: 'RESTAURANT', label: 'Resto', icon: 'fork' as const },
  { value: 'LODGING', label: 'Logement', icon: 'bed' as const },
  { value: 'ACTIVITY', label: 'Activité', icon: 'ticket' as const },
  { value: 'OTHER', label: 'Autre', icon: 'receipt' as const },
] as const;

export const SPLIT_METHODS = [
  { value: 'EQUAL', label: 'Égal' },
  { value: 'SHARES', label: 'Parts' },
  { value: 'EXACT', label: 'Exact' },
] as const;

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD'];

export interface Member {
  id: string;
  name: string;
}

export interface ExpenseEditData {
  id: string;
  label: string;
  category: (typeof CATEGORIES)[number]['value'];
  amount: number;
  currency: string;
  amountOriginal: number | null;
  currencyOriginal: string | null;
  date: string | Date;
  splitMethod: (typeof SPLIT_METHODS)[number]['value'];
  payer: { id: string };
  shares: { userId: string; amount: number }[];
}
