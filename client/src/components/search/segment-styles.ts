import { cn } from '@/lib/cn';

/**
 * Style dùng chung cho các ô của thanh tìm kiếm. Tách khỏi file component vì rule
 * `react-refresh/only-export-components` (file component chỉ được export component).
 */

/**
 * Khung một ô. Tất cả các ô dùng CHUNG khung này để không lặp lại lỗi cũ: trước đây ô ngày
 * mượn `DateRangePicker` (component dành cho form) nên tự vẽ thêm label + ô có viền + icon
 * riêng ⇒ hộp lồng hộp, chữ "Check-in" hiện hai lần, mỗi ô một cỡ chữ nhãn khác nhau.
 */
export const SEGMENT_CLASS =
  'group flex min-w-0 flex-col justify-center gap-1 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-surface-container/60 focus-within:bg-surface-container/60 aria-expanded:bg-surface-container/60';

/** Đường phân cách: gạch ngang khi xếp dọc (mobile), gạch dọc khi nằm ngang (desktop). */
export const SEGMENT_DIVIDER_CLASS =
  'border-t border-outline-variant/25 md:border-t-0 md:border-l';

/** Chữ giá trị của ô — mờ đi khi còn là placeholder để phân biệt "đã chọn" / "chưa chọn". */
export function segmentValueClass(hasValue: boolean): string {
  return cn(
    'truncate text-[15px] font-semibold',
    hasValue ? 'text-on-surface' : 'text-outline/60'
  );
}
