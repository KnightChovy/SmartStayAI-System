import type { PayoutListParams } from '@/types/payout.types';

export const payoutKeys = {
  /** Gốc — invalidate cả hai phía sau khi tạo/duyệt yêu cầu rút. */
  all: ['payouts'] as const,
  hotel: (hotelId: string, params: PayoutListParams) =>
    ['payouts', 'hotel', hotelId, params] as const,
  platform: (params: PayoutListParams) =>
    ['payouts', 'platform', params] as const,
  detail: (payoutId: string) => ['payouts', 'detail', payoutId] as const,
};
