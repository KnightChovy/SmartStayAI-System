import { api } from '@/lib/api';
import type {
  CommissionRateRequest,
  CommissionRequestsResponse,
  CreateCommissionRequestDto,
  HotelCommissionRequestsParams,
  HotelCommissionSummary,
} from '@/types/commission-rate.types';

function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

/** Nhóm endpoint hoa hồng của ĐỐI TÁC (quyền `getManagedHotel`, scope theo khách sạn). */
export const commissionRateService = {
  /** `GET /hotels/:hotelId/commission-rate` — mức đang chịu + ưu đãi + quyền nộp đơn. */
  async getHotelRate(hotelId: string): Promise<HotelCommissionSummary> {
    const { data } = await api.get<HotelCommissionSummary>(
      `/hotels/${hotelId}/commission-rate`
    );
    return data;
  },

  /** `POST /hotels/:hotelId/commission-requests` — nộp đơn xin giảm (hoặc gia hạn). */
  async createRequest(
    hotelId: string,
    dto: CreateCommissionRequestDto
  ): Promise<CommissionRateRequest> {
    const { data } = await api.post<CommissionRateRequest>(
      `/hotels/${hotelId}/commission-requests`,
      dto
    );
    return data;
  },

  /** `GET /hotels/:hotelId/commission-requests` — lịch sử đơn, mới nhất trước. */
  async listHotelRequests(
    hotelId: string,
    params: HotelCommissionRequestsParams = {}
  ): Promise<CommissionRequestsResponse> {
    const { data } = await api.get<CommissionRequestsResponse>(
      `/hotels/${hotelId}/commission-requests`,
      { params: cleanParams(params) }
    );
    return data;
  },
};
