/** Định dạng tiền VND theo kiểu "2.450.000 đ" (Hermes thiếu Intl đầy đủ nên group thủ công). */
export function formatVnd(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '—';
  const grouped = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped} đ`;
}
