import { useMutation } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';

/** Tra booking từ mã voucher (quét QR hoặc nhập tay). */
export function useLookupBooking(hotelId: string | undefined) {
  return useMutation({
    mutationFn: (voucherCode: string) => staffService.lookupBooking(hotelId as string, voucherCode),
  });
}
