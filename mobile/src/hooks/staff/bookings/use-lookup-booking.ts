import { useMutation } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';

/**
 * `GET /hotels/:hotelId/bookings/lookup?voucherCode=` — tra booking từ mã QR.
 * Dùng mutation vì kích hoạt theo hành động quét, không phải fetch tự động.
 */
export function useLookupBooking(hotelId: string) {
  return useMutation({
    mutationFn: (voucherCode: string) =>
      staffService.lookupBooking(hotelId, voucherCode),
  });
}
