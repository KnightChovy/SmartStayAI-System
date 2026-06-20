import { useMutation } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';

/**
 * Tạo URL thanh toán VNPay cho một booking. Thành công trả về `{ paymentUrl }`
 * để nơi gọi redirect trình duyệt sang cổng VNPay.
 */
export function useCreateVnpayPayment() {
  return useMutation({
    mutationFn: (bookingId: string) => paymentService.createVnpay(bookingId),
  });
}
