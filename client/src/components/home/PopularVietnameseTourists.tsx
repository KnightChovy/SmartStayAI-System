import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import CardCarousel from '@/components/shared/CardCarousel';
import { useDestinations } from '@/hooks/destinations';

/** Ô điểm đến nhỏ hơn thẻ khách sạn ⇒ nhét được nhiều hơn mỗi khung (giữ 2 cột như bản lưới cũ trên mobile). */
const TILE_BASIS = 'basis-1/2 sm:basis-1/3 lg:basis-1/4';

/**
 * Điểm đến phổ biến — số khách sạn thật từ `GET /v1/destinations` (đã sort nhiều KS nhất lên đầu).
 * Trước đây khối này liệt kê Singapore / Thái Lan / Hàn Quốc / Nhật Bản: sàn chỉ có khách sạn
 * ở Việt Nam nên bấm vào luôn ra 0 kết quả. Nay mỗi thẻ chắc chắn dẫn tới một trang search có phòng.
 */
export default function PopularVietnameseTourists() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  const { data, isLoading } = useDestinations();

  const destinations = (data ?? []).slice(0, 8);

  // Chưa có khách sạn nào đang bán → ẩn hẳn khối thay vì hiện lưới rỗng.
  if (!isLoading && destinations.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-8">
        {t('popular.title')}
      </h2>

      {isLoading ? (
        <CardCarousel count={4} basisClassName={TILE_BASIS}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-36 sm:h-48 rounded-3xl bg-surface-container-low" />
              <div className="mt-3 h-4 w-2/3 rounded bg-surface-container-low" />
              <div className="mt-1.5 h-3 w-1/2 rounded bg-surface-container-low" />
            </div>
          ))}
        </CardCarousel>
      ) : (
        <CardCarousel count={destinations.length} basisClassName={TILE_BASIS}>
          {destinations.map(dest => (
            <button
              key={dest.city}
              type="button"
              onClick={() => navigate(`/search?city=${encodeURIComponent(dest.city)}`)}
              className="group text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-3xl"
            >
              <div className="h-36 sm:h-48 rounded-3xl overflow-hidden mb-3 relative shadow-md bg-surface-container-low">
                {dest.image ? (
                  <img
                    alt={dest.city}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={dest.image}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-on-surface-variant">
                    <MapPin className="size-6" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              </div>
              <h4 className="font-bold text-on-surface font-be-vietnam text-base">
                {dest.city}
              </h4>
              <p className="text-xs text-on-surface-variant font-be-vietnam">
                {t('popular.stays', { count: dest.hotelCount })}
              </p>
            </button>
          ))}
        </CardCarousel>
      )}
    </section>
  );
}
