import { api } from '@/lib/api';
import type {
  HotelPerformance,
  PerformanceLeaderboard,
  PerformanceQueryParams,
  PlatformBookingsParams,
  PlatformBookingsResponse,
  PlatformPartnersParams,
  PlatformPartnersResponse,
} from '@/types/platform-manager.types';

function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

export const platformManagerService = {
  /** Danh sách toàn bộ đối tác (hotel_partner) — `GET /platform-manager/partners` (viewPlatformStats). */
  async listPartners(
    params: PlatformPartnersParams = {}
  ): Promise<PlatformPartnersResponse> {
    const { data } = await api.get<PlatformPartnersResponse>(
      '/platform-manager/partners',
      { params: cleanParams(params) }
    );
    return data;
  },

  /** Toàn bộ booking toàn sàn — `GET /platform-manager/bookings` (viewPlatformStats). */
  async listBookings(
    params: PlatformBookingsParams = {}
  ): Promise<PlatformBookingsResponse> {
    const { data } = await api.get<PlatformBookingsResponse>(
      '/platform-manager/bookings',
      { params: cleanParams(params) }
    );
    return data;
  },

  /** Bảng xếp hạng hiệu suất toàn sàn — `GET /platform-manager/performance` (viewPlatformStats). */
  async getPerformanceLeaderboard(
    params: PerformanceQueryParams = {}
  ): Promise<PerformanceLeaderboard> {
    const { data } = await api.get<PerformanceLeaderboard>(
      '/platform-manager/performance',
      { params: cleanParams(params) }
    );
    return data;
  },

  /**
   * Hiệu suất + điểm chi tiết của một khách sạn —
   * `GET /platform-manager/hotels/:hotelId/performance` (viewPlatformStats).
   */
  async getHotelPerformance(
    hotelId: string,
    params: PerformanceQueryParams = {}
  ): Promise<HotelPerformance> {
    const { data } = await api.get<HotelPerformance>(
      `/platform-manager/hotels/${hotelId}/performance`,
      { params: cleanParams(params) }
    );
    return data;
  },
};
