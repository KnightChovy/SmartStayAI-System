/**
 * Đọc số giờ hủy miễn phí từ `hotel.settings.cancellation.freeUntilHours` (SS-302).
 * `settings` là JSON tự do (`Record<string, unknown>`) nên phải bóc tách phòng thủ.
 * Trả:
 *  - số > 0 : hủy miễn phí trước N giờ
 *  - 0      : không hoàn tiền (non-refundable)
 *  - null   : khách sạn chưa khai chính sách (chưa biết → không hiển thị gì)
 */
export function getFreeCancellationHours(
  settings: Record<string, unknown> | null | undefined
): number | null {
  if (!settings || typeof settings !== 'object') return null;
  const cancellation = (settings as Record<string, unknown>).cancellation;
  if (!cancellation || typeof cancellation !== 'object') return null;
  const hours = (cancellation as Record<string, unknown>).freeUntilHours;
  return typeof hours === 'number' ? hours : null;
}
