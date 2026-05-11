export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatSignedCurrency(amount: number, currency = 'EUR'): string {
  if (amount === 0) return formatCurrency(0, currency);
  const sign = amount > 0 ? '+' : '−';
  return `${sign}${formatCurrency(Math.abs(amount), currency).replace('−', '')}`;
}

export function formatDateRange(start: string | Date | null, end: string | Date | null): string {
  if (!start || !end) return 'Dates à définir';
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt(s)} → ${fmt(e)} ${e.getFullYear()}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
