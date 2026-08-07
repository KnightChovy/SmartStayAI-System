import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * Xem trước tiền hoàn nếu huỷ ngay bây giờ (`GET /bookings/:id/refund-preview`).
 *
 * ⚠️ **`staleTime: 0` là cố ý**: số tiền hoàn phụ thuộc vào **thời điểm** (chính sách bậc thang —
 * qua một mốc giờ là mức hoàn tụt xuống). Cache lại thì khách có thể đọc một con số đã hết hiệu lực
 * rồi bấm Huỷ và nhận về ít hơn. Chỉ gọi khi khách thật sự mở khối huỷ nên không tốn request thừa.
 */
export function useRefundPreview(bookingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.bookings.refundPreview(bookingId ?? ''),
    queryFn: () => bookingService.getRefundPreview(bookingId as string),
    enabled: Boolean(bookingId) && enabled,
    staleTime: 0,
    // Quay lại tab sau khi đi pha cà phê thì mốc giờ có thể đã trôi qua — tải lại cho chắc.
    refetchOnWindowFocus: true,
  });
}
