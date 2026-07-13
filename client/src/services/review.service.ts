import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type { MyReviewRaw, ReviewItem } from '@/types/account.types';

/** Đánh giá của khách đang đăng nhập (`GET /reviews/me`). */
export const reviewService = {
  async listMine(): Promise<ReviewItem[]> {
    const { data } = await api.get<Paginated<MyReviewRaw>>('/reviews/me', {
      params: { limit: 100, sortBy: 'createdAt:desc' },
    });
    return data.results.map(r => ({
      id: r.id,
      hotelName: r.hotel?.name ?? '—',
      bookingCode: r.booking?.bookingCode ?? '—',
      overallRating: r.overallRating,
      cleanlinessRating: r.cleanlinessRating,
      serviceRating: r.serviceRating,
      locationRating: r.locationRating,
      valueRating: r.valueRating,
      title: r.title ?? undefined,
      content: r.content,
      images: r.images?.map(img => img.url) ?? [],
      managerResponse: r.managerResponse,
      status: r.status,
      createdAt: r.createdAt,
    }));
  },
};
