import type { HotelReviewsParams } from '@/types/hotel-review.types';

/** Query keys cho phần Reviews của Hotel Partner. */
export const hotelReviewKeys = {
  list: (hotelId: string, params: HotelReviewsParams) =>
    ['hotel-reviews', 'list', hotelId, params] as const,
  stats: (hotelId: string) => ['hotel-reviews', 'stats', hotelId] as const,
};
