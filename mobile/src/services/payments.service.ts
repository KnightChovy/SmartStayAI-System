import { api } from '@/lib/api';
import type { CreateVnpayPaymentResponse } from '@/types/payments.type';

/** Tầng gọi API thanh toán (`/v1/payments`). */
export const paymentsService = {
  /**
   * Tạo URL thanh toán VNPay cho một booking đang chờ thanh toán
   * (`POST /payments/bookings/:bookingId/vnpay`). Cần đăng nhập và là chủ booking.
   * Trả về `paymentUrl` — mở qua `expo-web-browser` / `Linking` để khách thanh toán.
   */
  async createVnpay(bookingId: string): Promise<CreateVnpayPaymentResponse> {
    const { data } = await api.post<CreateVnpayPaymentResponse>(
      `/payments/bookings/${bookingId}/vnpay`
    );
    return data;
  },
};
