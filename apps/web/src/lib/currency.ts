export function currencySymbol(code: string): string {
  switch (code) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    case 'JPY':
      return '¥';
    case 'CAD':
      return 'CA$';
    case 'CHF':
      return 'CHF';
    default:
      return code;
  }
}
