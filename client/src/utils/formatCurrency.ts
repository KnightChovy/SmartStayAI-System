/**
 * Format tiền tệ. Mặc định VND. Nhận string (Prisma Decimal qua JSON) hoặc number.
 */
export function formatCurrency(
  value: string | number | null | undefined,
  currency: 'VND' | 'USD' = 'VND'
): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return '—';

  return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(amount);
}
