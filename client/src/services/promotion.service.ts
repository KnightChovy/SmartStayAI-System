import { delay } from './mock/mockStore';
import type { PromotionItem } from '@/types/account.types';

/** [MOCK] Khuyến mãi / voucher khả dụng. Backend chưa có endpoint promotions. */
export const promotionService = {
  async listAvailable(): Promise<PromotionItem[]> {
    return delay([
      {
        id: 'p1',
        name: 'Summer escape',
        code: 'SUMMER25',
        description: 'Save 25% on stays of 2 nights or more.',
        discountType: 'percentage',
        discountValue: 25,
        minNights: 2,
        endDate: '2026-08-31T23:59:59Z',
      },
      {
        id: 'p2',
        name: 'Welcome gift',
        code: 'WELCOME200',
        description: 'Flat 200,000₫ off your first booking.',
        discountType: 'fixed_amount',
        discountValue: 200000,
        endDate: '2026-12-31T23:59:59Z',
      },
      {
        id: 'p3',
        name: 'Stay 3 pay 2',
        code: 'FREENIGHT',
        description: 'Get 1 free night when you book 3 nights.',
        discountType: 'free_night',
        discountValue: 1,
        minNights: 3,
        endDate: '2026-09-30T23:59:59Z',
      },
    ]);
  },
};
