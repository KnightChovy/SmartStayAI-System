import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';
import type { CancelBookingPayload } from '@/types/booking.types';

/**
 * Huỷ booking (`PATCH /bookings/:id/cancel`).
 *
 * Số tiền hoàn do BE tính theo chính sách bậc thang tại **thời điểm gọi** — dùng
 * `useRefundPreview` để cho khách xem trước, đừng tự tính lại ở client.
 */
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      ...payload
    }: { bookingId: string } & CancelBookingPayload) =>
      bookingService.cancel(bookingId, payload),
    onSuccess: booking => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
      qc.setQueryData(queryKeys.bookings.detail(booking.id), booking);
    },
  });
}
