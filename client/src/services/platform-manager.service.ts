import { api } from '@/lib/api';
import type {
  CommissionRateRequest,
  CommissionRequestsResponse,
  PlatformBaseRate,
  PlatformCommissionRequestsParams,
  ReviewCommissionRequestDto,
  SetBaseRateDto,
} from '@/types/commission-rate.types';
import type {
  HotelPerformance,
  PerformanceLeaderboard,
  PerformanceQueryParams,
  PlatformBookingsParams,
  PlatformBookingsResponse,
  PlatformPartnersParams,
  PlatformPartnersResponse,
  SetPartnerStatusDto,
  SetPartnerStatusResponse,
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

  // ─── Hoa hồng (quyền `manageCommissions`) ──────────────────────────────────

  /** `GET /platform-manager/commission-requests` — hàng chờ, CŨ NHẤT TRƯỚC. */
  async listCommissionRequests(
    params: PlatformCommissionRequestsParams = {}
  ): Promise<CommissionRequestsResponse> {
    const { data } = await api.get<CommissionRequestsResponse>(
      '/platform-manager/commission-requests',
      { params: cleanParams(params) }
    );
    return data;
  },

  /** `PATCH /platform-manager/commission-requests/:requestId/review` — duyệt / từ chối. */
  async reviewCommissionRequest(
    requestId: string,
    dto: ReviewCommissionRequestDto
  ): Promise<CommissionRateRequest> {
    const { data } = await api.patch<CommissionRateRequest>(
      `/platform-manager/commission-requests/${requestId}/review`,
      dto
    );
    return data;
  },

  /** `GET /platform-manager/commission-rate` — mức nền + lịch đã đặt + lịch sử. */
  async getBaseRate(): Promise<PlatformBaseRate> {
    const { data } = await api.get<PlatformBaseRate>(
      '/platform-manager/commission-rate'
    );
    return data;
  },

  /** `PUT /platform-manager/commission-rate` — đặt mức nền mới (báo trước ≥ 30 ngày). */
  async setBaseRate(dto: SetBaseRateDto): Promise<PlatformBaseRate> {
    const { data } = await api.put<PlatformBaseRate>(
      '/platform-manager/commission-rate',
      dto
    );
    return data;
  },

  // ─── Đình chỉ đối tác (quyền `manageHotels`) ───────────────────────────────

  /** `PATCH /platform-manager/partners/:partnerId/status` — đình chỉ / khôi phục. */
  async setPartnerStatus(
    partnerId: string,
    dto: SetPartnerStatusDto
  ): Promise<SetPartnerStatusResponse> {
    const { data } = await api.patch<SetPartnerStatusResponse>(
      `/platform-manager/partners/${partnerId}/status`,
      dto
    );
    return data;
  },
};
