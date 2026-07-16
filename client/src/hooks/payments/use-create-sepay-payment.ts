import { useMutation } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';

/** Lấy QR chuyển khoản SePay cho một booking đang chờ thanh toán. */
export function useCreateSepayPayment() {
  return useMutation({
    mutationFn: (bookingId: string) => paymentService.createSepay(bookingId),
  });
}
