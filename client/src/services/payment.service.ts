import { api } from '@/lib/api';
import type { CreateVnpayPaymentResponse, SepayPaymentInfo } from '@/types/payment.types';
import type { PayWithWalletResponse } from '@/types/wallet.types';

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

  /**
   * Trả booking bằng số dư ví (`POST /payments/bookings/:bookingId/wallet`). Cần là chủ booking,
   * booking phải `pending` và còn hạn giữ chỗ.
   *
   * Ví nhiều hơn số còn thiếu thì BE chỉ trừ đúng phần còn thiếu (không bao giờ thu dư); ví ít hơn
   * thì trừ hết và booking **vẫn `pending`** để khách trả nốt qua cổng — xem `remainingToPay`.
   */
  async payWithWallet(bookingId: string): Promise<PayWithWalletResponse> {
    const { data } = await api.post<PayWithWalletResponse>(
      `/payments/bookings/${bookingId}/wallet`
    );
    return data;
  },
};
