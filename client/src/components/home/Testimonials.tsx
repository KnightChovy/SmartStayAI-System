import { useTranslation } from 'react-i18next';
import { useLandingTestimonials } from '@/hooks/reviews/use-landing-testimonials';
import { TestimonialsColumn } from '@/components/blocks/testimonials-columns-1';

/**
 * Carousel testimonial thật (SS-004) — lấy đánh giá công khai của nhiều khách sạn qua
 * `useLandingTestimonials`. Nếu chưa có testimonial nào thì ẩn gọn cả block (không để khung trống).
 */
export default function Testimonials() {
  const { t } = useTranslation('home');
  const { testimonials, isLoading } = useLandingTestimonials();

  // Ẩn khi đang tải hoặc chưa có đánh giá — không hiện khung rỗng.
  if (isLoading || testimonials.length === 0) return null;

  const columns = [
    testimonials.slice(0, Math.ceil(testimonials.length / 3)),
    testimonials.slice(Math.ceil(testimonials.length / 3), Math.ceil((2 * testimonials.length) / 3)),
    testimonials.slice(Math.ceil((2 * testimonials.length) / 3)),
  ];

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-margin-mobile md:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-be-vietnam text-3xl font-bold text-on-surface">
            {t('testimonials.title')}
          </h2>
          <p className="mt-3 text-on-surface-variant">{t('testimonials.subtitle')}</p>
        </div>

        <div className="mt-12 flex max-h-[560px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
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
