import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useSearchHotels } from '@/hooks/hotels/use-search-hotels';
import { publicReviewService } from '@/services/public-review.service';
import { reviewKeys } from './keys';
import { initialsAvatar } from '@/utils/avatar';
import type { Testimonial } from '@/components/blocks/testimonials-columns-1';

/**
 * Gom đánh giá công khai thật của nhiều khách sạn thành danh sách testimonial cho landing page.
 * Đánh giá là dữ liệu per-hotel nên: lấy vài khách sạn đầu (`GET /hotels`) rồi fetch song song
 * `GET /reviews?hotelId=` cho từng khách sạn (React Query `useQueries`), ghép tên KS làm "role".
 */
export function useLandingTestimonials(hotelLimit = 12, reviewsPerHotel = 3) {
  const hotelsQuery = useSearchHotels({ limit: hotelLimit });
  const hotels = useMemo(
    () => hotelsQuery.data?.results ?? [],
    [hotelsQuery.data]
  );

  const reviewQueries = useQueries({
    queries: hotels.map(hotel => ({
      queryKey: reviewKeys.public({
        hotelId: hotel.id,
        limit: reviewsPerHotel,
      }),
      queryFn: () =>
        publicReviewService.list({ hotelId: hotel.id, limit: reviewsPerHotel }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const testimonials = useMemo<Testimonial[]>(() => {
    const out: Testimonial[] = [];
    reviewQueries.forEach((query, index) => {
      const hotel = hotels[index];
      if (!hotel) return;
      for (const review of query.data?.results ?? []) {
        out.push({
          text: review.content,
          image: review.customer.fullName
            ? initialsAvatar(review.customer.fullName)
            : initialsAvatar('?'),
          name: review.customer.fullName || 'Guest',
          role: [hotel.name, hotel.city].filter(Boolean).join(' · '),
          rating: review.overallRating,
        });
      }
    });
    return out;
    // reviewQueries đổi tham chiếu mỗi render → phụ thuộc data đã gom trong chính nó là đủ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels, reviewQueries.map(q => q.dataUpdatedAt).join(',')]);

  const isLoading =
    hotelsQuery.isLoading ||
    (hotels.length > 0 && reviewQueries.some(q => q.isLoading));

  return { testimonials, isLoading, isError: hotelsQuery.isError };
}
