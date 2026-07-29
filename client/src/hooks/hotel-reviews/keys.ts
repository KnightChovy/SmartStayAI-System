import type { HotelReviewsParams, PublicReviewsParams } from '@/types/hotel-review.types';

/** Query keys cho phần Reviews (partner + public guest). */
export const hotelReviewKeys = {
  list: (hotelId: string, params: HotelReviewsParams) =>
    ['hotel-reviews', 'list', hotelId, params] as const,
  stats: (hotelId: string) => ['hotel-reviews', 'stats', hotelId] as const,
  publicStats: (hotelId: string) => ['hotel-reviews', 'public-stats', hotelId] as const,
  publicList: (hotelId: string, params: PublicReviewsParams) =>
    ['hotel-reviews', 'public', hotelId, params] as const,
};
