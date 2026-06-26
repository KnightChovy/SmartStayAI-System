import { useMutation } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments.service';

/**
 * `POST /payments/bookings/:bookingId/vnpay` — tạo URL thanh toán VNPay.
 * Dùng `data.paymentUrl` mở qua `expo-web-browser` để khách thanh toán.
 */
export function useCreateVnpayPayment() {
  return useMutation({
    mutationFn: (bookingId: string) => paymentsService.createVnpay(bookingId),
  });
}
