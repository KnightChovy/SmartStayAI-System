import { TestimonialsColumn } from '../blocks/testimonials-columns-1';
import { useLandingTestimonials } from '@/hooks/reviews';

export default function GuestFavorites() {
  const { testimonials, isLoading } = useLandingTestimonials();

  // Chia đều review thật thành 3 cột marquee.
  const columns = [
    testimonials.filter((_, i) => i % 3 === 0),
    testimonials.filter((_, i) => i % 3 === 1),
    testimonials.filter((_, i) => i % 3 === 2),
  ];

  // Chưa có review thật nào → ẩn section thay vì hiển thị dữ liệu giả.
  if (!isLoading && testimonials.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="flex flex-col items-center text-center mb-10">
        <span className="rounded-full border border-outline-variant/30 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary font-be-vietnam">
          Guest Reviews
        </span>
        <h2 className="font-be-vietnam text-2xl md:text-3xl font-bold text-on-surface mt-4">
          The guest's favorite accommodation
        </h2>
        <p className="text-on-surface-variant text-sm font-medium font-be-vietnam mt-2 max-w-lg">
          Real words from travelers who found their perfect stay with SmartStay
          AI.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`h-96 w-full max-w-xs rounded-3xl bg-surface-container animate-pulse ${i === 1 ? 'hidden md:block' : ''} ${i === 2 ? 'hidden lg:block' : ''}`}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center gap-6 mask-[linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] max-h-150 overflow-hidden">
          <TestimonialsColumn testimonials={columns[0]} duration={15} />
          {columns[1].length > 0 && (
            <TestimonialsColumn
              testimonials={columns[1]}
              className="hidden md:block"
              duration={19}
            />
          )}
          {columns[2].length > 0 && (
            <TestimonialsColumn
              testimonials={columns[2]}
              className="hidden lg:block"
              duration={17}
            />
          )}
        </div>
      )}
    </section>
  );
}
