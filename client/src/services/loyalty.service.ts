import { delay } from './mock/mockStore';
import type { LoyaltyAccount } from '@/types/account.types';

/** [MOCK] Tài khoản điểm thưởng. Backend chưa có endpoint loyalty. */
export const loyaltyService = {
  async get(): Promise<LoyaltyAccount> {
    return delay({
      totalPoints: 3250,
      tier: 'silver',
      transactions: [
        {
          id: 't1',
          type: 'earn',
          points: 450,
          description: 'Stay at Lotus Riverside Hotel',
          createdAt: '2026-05-20T10:00:00Z',
        },
        {
          id: 't2',
          type: 'earn',
          points: 800,
          description: 'Stay at Pearl Bay Resort',
          createdAt: '2026-04-12T10:00:00Z',
        },
        {
          id: 't3',
          type: 'redeem',
          points: -500,
          description: 'Redeemed for room upgrade',
          createdAt: '2026-03-02T10:00:00Z',
        },
        {
          id: 't4',
          type: 'earn',
          points: 2500,
          description: 'Welcome bonus',
          createdAt: '2026-01-15T10:00:00Z',
        },
      ],
    });
  },
};
