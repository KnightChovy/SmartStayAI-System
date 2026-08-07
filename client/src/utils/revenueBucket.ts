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

/** Khoá của kỳ ĐANG CHẠY theo bucket: `2026-08` hoặc `2026-08-07` (giờ local). */
export function currentPeriodKey(bucket: RevenueBucket): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return bucket === 'month' ? day.slice(0, 7) : day;
}

/**
 * Bỏ các kỳ nằm **hoàn toàn ở tương lai**.
 *
 * Preset kiểu "This quarter" kéo tới hết quý nên BE trả về các bucket rỗng của tháng chưa
 * tới; giữ lại thì biểu đồ đổ dốc xuống 0 và file xuất ra có dòng toàn số 0 — cả hai đều bị
 * đọc thành "doanh thu sụp" trong khi thực tế là "chưa tới ngày".
 *
 * Dùng chung cho biểu đồ **và** bản xuất: hai bên lệch luật thì file tải về không khớp thứ
 * người dùng vừa nhìn thấy. Khoá kỳ là `YYYY-MM`/`YYYY-MM-DD` nên so chuỗi là so đúng thời gian.
 */
export function dropFuturePeriods<T extends { period: string }>(
  points: T[],
  bucket: RevenueBucket
): T[] {
  const current = currentPeriodKey(bucket);
  return points.filter(p => p.period <= current);
}
