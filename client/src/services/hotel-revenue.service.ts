import { api } from '@/lib/api';
import type {
  HotelPayoutAccountSummary,
  HotelRevenueParams,
  HotelRevenueReport,
  HotelWalletResponse,
  UpdatePayoutAccountDto,
} from '@/types/hotel-revenue.types';
import type {
  HotelPerformance,
  PerformanceQueryParams,
} from '@/types/platform-manager.types';

/** Bỏ các field undefined/null/rỗng để query string gọn gàng. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export const hotelRevenueService = {
  /** Báo cáo doanh thu 1 khách sạn theo [from, to] — `GET /hotels/:id/revenue` (owner/manager). */
  async getRevenue(
    hotelId: string,
    params: HotelRevenueParams = {}
  ): Promise<HotelRevenueReport> {
    const { data } = await api.get<HotelRevenueReport>(`/hotels/${hotelId}/revenue`, {
      params: cleanParams(params),
    });
    return data;
  },

  /**
   * `GET /hotels/:id/wallet` — **chỉ số dư** (available / pending / pendingPayout).
   *
   * ⚠️ Endpoint này KHÔNG còn trả `transactions` và không còn nhận `type`/`page`/`limit`.
   * Sổ giao dịch đã chuyển sang `getRevenue` (field `transactions`).
   */
  async getWallet(hotelId: string): Promise<HotelWalletResponse> {
    const { data } = await api.get<HotelWalletResponse>(`/hotels/${hotelId}/wallet`);
    return data;
  },

  /**
   * `PUT /hotels/:id/payout-account` — **chỉ CHỦ khách sạn** (người khác nhận 403).
   *
   * Đã có tài khoản chính thì BE update **tại chỗ** (giữ nguyên `id`) nên các yêu cầu rút đang
   * `pending` không bị hỏng — nhưng cũng có nghĩa Platform Manager sẽ chuyển tiền vào tài khoản
   * MỚI cho những yêu cầu đó.
   */
  async updatePayoutAccount(
    hotelId: string,
    payload: UpdatePayoutAccountDto
  ): Promise<HotelPayoutAccountSummary> {
    const { data } = await api.put<HotelPayoutAccountSummary>(
      `/hotels/${hotelId}/payout-account`,
      payload
    );
    return data;
  },

  /**
   * Hiệu suất vận hành + điểm tổng hợp của 1 khách sạn — `GET /hotels/:id/analytics` (owner/manager).
   * Cùng shape với `/platform-manager/hotels/:id/performance` nên tái dùng `HotelPerformance`.
   */
  async getAnalytics(
    hotelId: string,
    params: PerformanceQueryParams = {}
  ): Promise<HotelPerformance> {
    const { data } = await api.get<HotelPerformance>(`/hotels/${hotelId}/analytics`, {
      params: cleanParams(params),
    });
    return data;
  },
};
