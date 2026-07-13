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

/**
 * Quy đổi số tiền **VND (gốc)** sang tiền tệ hiển thị rồi format.
 * BE luôn trả giá bằng VND; USD chỉ là lớp hiển thị (chia cho tỷ giá).
 */
export function formatMoney(
  vndValue: string | number | null | undefined,
  currency: 'VND' | 'USD',
  vndPerUsd: number
): string {
  if (vndValue === null || vndValue === undefined || vndValue === '') return '—';
  const vnd = typeof vndValue === 'string' ? Number(vndValue) : vndValue;
  if (Number.isNaN(vnd)) return '—';

  const amount = currency === 'USD' && vndPerUsd > 0 ? vnd / vndPerUsd : vnd;
  return formatCurrency(amount, currency);
}

/** Bỏ đuôi ".0" thừa: "4.0" → "4", "4.2" giữ nguyên. */
function trimZero(n: string): string {
  return n.replace(/\.0$/, '');
}

/**
 * Tiền VND rút gọn: ₫X.XB / ₫XM / ₫XK cho KPI/chart. Nhận string|number.
 * Dùng kèm `formatVndFull` cho tooltip số đầy đủ (AC-11).
 */
export function formatCompactVnd(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return '—';

  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1e9) return `${sign}₫${trimZero((abs / 1e9).toFixed(1))}B`;
  if (abs >= 1e6) return `${sign}₫${trimZero((abs / 1e6).toFixed(1))}M`;
  if (abs >= 1e3) return `${sign}₫${trimZero((abs / 1e3).toFixed(1))}K`;
  return `${sign}₫${abs}`;
}

/** Số tiền VND đầy đủ có phân tách hàng nghìn: "₫4,231,500,000" — dùng cho tooltip. */
export function formatVndFull(value: string | number | null | undefined): string {
  return formatCurrency(value, 'VND');
}
