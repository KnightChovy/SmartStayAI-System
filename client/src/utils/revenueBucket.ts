import type { RevenueBucket } from '@/types/revenue.types';

/**
 * Luật gom bucket cho mọi báo cáo doanh thu theo kỳ.
 *
 * Tách ra dùng chung vì trang tổng (`/admin/revenue`) và khối drill-down một khách sạn
 * (`/hotels/:id/revenue`) phải gom **cùng một cách**: hai bên lệch `groupBy` thì cùng một
 * kỳ ra hai hình dạng biểu đồ khác nhau và người đọc tưởng số vênh nhau.
 */

export const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` → mốc UTC. Dùng UTC để so khoảng không lệch theo múi giờ máy người dùng. */
export function parseDateKey(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Số ngày trong [from, to], tính cả hai đầu. */
export function daysInclusive(from: string, to: string): number {
  return Math.max(0, Math.floor((parseDateKey(to) - parseDateKey(from)) / DAY_MS) + 1);
}

/** ≤ 45 ngày thì vẽ theo ngày, dài hơn gom theo tháng (2 giá trị `groupBy` mà BE nhận). */
export function pickRevenueBucket(from: string, to: string): RevenueBucket {
  return daysInclusive(from, to) <= 45 ? 'day' : 'month';
}
