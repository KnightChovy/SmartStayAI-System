import { api } from '@/lib/api';
import type { CreateVnpayPaymentResponse, SepayPaymentInfo } from '@/types/payment.types';

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

  /** Lấy QR chuyển khoản SePay cho booking đang chờ thanh toán (`POST /payments/bookings/:id/sepay`). */
  async createSepay(bookingId: string): Promise<SepayPaymentInfo> {
    const { data } = await api.post<SepayPaymentInfo>(`/payments/bookings/${bookingId}/sepay`);
    return data;
  },
};
