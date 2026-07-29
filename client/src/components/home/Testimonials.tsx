import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeaturedReviews } from '@/hooks/platform';
import { TestimonialsColumn, type Testimonial } from '@/components/blocks/testimonials-columns-1';
import RatingBadge from '@/components/shared/RatingBadge';
import { initialsAvatar } from '@/utils/avatar';

/**
 * Carousel testimonial thật (SS-004) — lấy từ `GET /v1/reviews/featured`.
 * Nếu chưa có testimonial nào thì ẩn gọn cả block (không để khung trống).
 */
export default function Testimonials() {
  const { t } = useTranslation('home');
  const { data, isLoading } = useFeaturedReviews({ limit: 9 });

  const testimonials = useMemo<Testimonial[]>(
    () =>
      (data ?? []).map(r => ({
        text: r.content,
        image: r.avatarUrl ?? initialsAvatar(r.customerName || '?'),
        name: r.customerName || 'Guest',
        role: [r.hotelName, r.hotelCity].filter(Boolean).join(' · '),
        // overallRating thang 10 → quy về 5 sao cho block testimonial (chỉ để hiển thị sao).
        rating: r.overallRating / 2,
      })),
    [data]
  );

  // Ẩn khi đang tải hoặc chưa có đánh giá — không hiện khung rỗng.
  if (isLoading || testimonials.length === 0) return null;

  const third = Math.ceil(testimonials.length / 3);
  const columns = [
    testimonials.slice(0, third),
    testimonials.slice(third, third * 2),
    testimonials.slice(third * 2),
  ];

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-margin-mobile md:px-8">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <RatingBadge className="mb-5" />
          <h2 className="font-be-vietnam text-3xl font-bold text-on-surface">
            {t('testimonials.title')}
          </h2>
          <p className="mt-3 text-on-surface-variant">{t('testimonials.subtitle')}</p>
        </div>

        <div className="mt-12 flex max-h-140 justify-center gap-6 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <TestimonialsColumn testimonials={columns[0]} duration={16} />
          {columns[1].length > 0 && (
            <TestimonialsColumn
              testimonials={columns[1]}
              duration={20}
              className="hidden md:block"
            />
          )}
          {columns[2].length > 0 && (
            <TestimonialsColumn
              testimonials={columns[2]}
              duration={18}
              className="hidden lg:block"
            />
          )}
        </div>
      </div>
    </section>
  );
}
