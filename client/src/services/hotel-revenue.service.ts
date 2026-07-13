import { api } from '@/lib/api';
import type {
  HotelRevenueParams,
  HotelRevenueReport,
  HotelWalletParams,
  HotelWalletResponse,
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

  /** Số dư ví + sổ giao dịch phân trang của 1 khách sạn — `GET /hotels/:id/wallet` (owner/manager). */
  async getWallet(
    hotelId: string,
    params: HotelWalletParams = {}
  ): Promise<HotelWalletResponse> {
    const { data } = await api.get<HotelWalletResponse>(`/hotels/${hotelId}/wallet`, {
      params: cleanParams(params),
    });
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
