import type {
  HotelRefundsParams,
  PlatformRefundsParams,
} from '@/types/refund.types';

export const refundKeys = {
  all: ['refunds'] as const,
  hotel: (hotelId: string, params: HotelRefundsParams) =>
    ['refunds', 'hotel', hotelId, params] as const,
  platform: (params: PlatformRefundsParams) =>
    ['refunds', 'platform', params] as const,
};
