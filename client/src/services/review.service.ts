import { delay, readMock, writeMock } from './mock/mockStore';
import type { CreateReviewInput, ReviewItem } from '@/types/account.types';

/** [MOCK] Đánh giá của tôi. Backend chưa có endpoint reviews cho customer. */
const KEY = 'reviews';

const SEED: ReviewItem[] = [
  {
    id: 'r1',
    hotelName: 'Pearl Bay Resort',
    bookingCode: 'BKPEARL01',
    overallRating: 5,
    cleanlinessRating: 5,
    serviceRating: 5,
    locationRating: 4,
    valueRating: 4,
    title: 'Unforgettable ocean view',
    content: 'Stunning resort, attentive staff and an incredible breakfast spread. Will return!',
    images: [],
    managerResponse: 'Thank you for the kind words — we can’t wait to host you again!',
    createdAt: '2026-04-18T10:00:00Z',
  },
];

export const reviewService = {
  async listMine(): Promise<ReviewItem[]> {
    return delay(readMock(KEY, SEED));
  },

  async create(input: CreateReviewInput): Promise<ReviewItem> {
    const list = readMock(KEY, SEED);
    const item: ReviewItem = {
      ...input,
      id: `r${Date.now()}`,
      managerResponse: null,
      createdAt: new Date().toISOString(),
    };
    writeMock(KEY, [item, ...list]);
    return delay(item);
  },
};
