import { useMutation } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments.service';

/**
 * `POST /payments/bookings/:bookingId/sepay` — tạo QR chuyển khoản SePay.
 * Dùng `data` để mở `SepayQrModal` (không redirect như VNPay).
 */
export function useCreateSepayPayment() {
  return useMutation({
    mutationFn: (bookingId: string) => paymentsService.createSepay(bookingId),
  });
}
