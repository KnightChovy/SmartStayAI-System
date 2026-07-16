import { api } from '@/lib/api';
import type {
  HotelRefundsParams,
  PlatformRefundsParams,
  ProcessRefundDto,
  Refund,
  RefundsResponse,
  ReviewRefundDto,
} from '@/types/refund.types';

function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

export const refundService = {
  async listHotelRefunds(
    hotelId: string,
    params: HotelRefundsParams = {}
  ): Promise<RefundsResponse> {
    const { data } = await api.get<RefundsResponse>(
      `/hotels/${hotelId}/refunds`,
      {
        params: cleanParams(params),
      }
    );
    return data;
  },

  async review(
    hotelId: string,
    refundId: string,
    dto: ReviewRefundDto
  ): Promise<Refund> {
    const { data } = await api.patch<Refund>(
      `/hotels/${hotelId}/refunds/${refundId}/review`,
      dto
    );
    return data;
  },

  async listPlatformRefunds(
    params: PlatformRefundsParams = {}
  ): Promise<RefundsResponse> {
    const { data } = await api.get<RefundsResponse>(
      '/platform-manager/refunds',
      {
        params: cleanParams(params),
      }
    );
    return data;
  },

  async process(refundId: string, dto: ProcessRefundDto): Promise<Refund> {
    const { data } = await api.patch<Refund>(
      `/platform-manager/refunds/${refundId}/process`,
      dto
    );
    return data;
  },
};
