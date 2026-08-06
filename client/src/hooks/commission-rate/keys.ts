import type { HotelCommissionRequestsParams } from '@/types/commission-rate.types';

export const commissionRateKeys = {
  /** Prefix chung — invalidate key này là quét sạch cả mức hiện tại lẫn lịch sử đơn. */
  all: ['commission-rate'] as const,
  hotelRate: (hotelId: string) =>
    ['commission-rate', 'hotel', hotelId] as const,
  hotelRequests: (hotelId: string, params: HotelCommissionRequestsParams) =>
    ['commission-rate', 'hotel-requests', hotelId, params] as const,
};
