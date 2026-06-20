import { api } from '@/lib/api';
import type { CreateVnpayPaymentResponse } from '@/types/payment.types';

export const paymentService = {
  /**
   * Tạo URL thanh toán VNPay cho một booking đang chờ thanh toán
   * (`POST /payments/bookings/:bookingId/vnpay`). Cần đăng nhập và là chủ booking.
   * Trả về `paymentUrl` để frontend redirect sang cổng VNPay.
   */
  async createVnpay(bookingId: string): Promise<CreateVnpayPaymentResponse> {
    const { data } = await api.post<CreateVnpayPaymentResponse>(
      `/payments/bookings/${bookingId}/vnpay`
    );
    return data;
  },
};
