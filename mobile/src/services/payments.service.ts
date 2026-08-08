import { api } from '@/lib/api';
import type { CreateVnpayPaymentResponse, SepayPaymentInfo } from '@/types/payments.type';
import type { PayWithWalletResponse } from '@/types/wallet.type';

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

  /**
   * Tạo QR chuyển khoản SePay (`POST /payments/bookings/:bookingId/sepay`). Không
   * redirect — khách quét QR, SePay báo webhook về BE, app tự poll trạng thái booking.
   */
  async createSepay(bookingId: string): Promise<SepayPaymentInfo> {
    const { data } = await api.post<SepayPaymentInfo>(
      `/payments/bookings/${bookingId}/sepay`
    );
    return data;
  },

  /**
   * Trả booking bằng số dư ví (`POST /payments/bookings/:bookingId/wallet`). Ví KHÔNG
   * đủ vẫn dùng được — BE trừ hết phần lo được, giữ booking `pending`, trả về
   * `remainingToPay` để app biết còn phải trả nốt bao nhiêu qua cổng khác.
   */
  async payWithWallet(bookingId: string): Promise<PayWithWalletResponse> {
    const { data } = await api.post<PayWithWalletResponse>(
      `/payments/bookings/${bookingId}/wallet`
    );
    return data;
  },
};
