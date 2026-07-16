import type { HotelRefundsParams, PlatformRefundsParams } from '@/types/refund.types';

/** Query keys cho khu vực hoàn tiền (hàng đợi của khách sạn + hàng đợi toàn sàn). */
export const refundKeys = {
  /** Gốc — invalidate cái này là quét cả 2 hàng đợi (một refund vừa duyệt sẽ rơi sang hàng đợi PM). */
  all: ['refunds'] as const,
  hotel: (hotelId: string, params: HotelRefundsParams) =>
    ['refunds', 'hotel', hotelId, params] as const,
  platform: (params: PlatformRefundsParams) => ['refunds', 'platform', params] as const,
};
