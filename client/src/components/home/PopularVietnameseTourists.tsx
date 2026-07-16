import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { useSearchHotels } from '@/hooks/hotels';
import type { HotelSearchResult } from '@/types/hotel.types';

/** Điểm đến suy ra từ danh sách khách sạn thật. */
interface Destination {
  city: string;
  hotelCount: number;
  img: string | null;
}

/** Ảnh đại diện của một khách sạn: ưu tiên ảnh primary, sau đó ảnh đầu tiên. */
function coverOf(hotel: HotelSearchResult): string | null {
  const images = hotel.images ?? [];
  return (images.find(i => i.isPrimary) ?? images[0])?.url ?? null;
}

/**
 * Điểm đến phổ biến — gom từ chính khách sạn đang bán (`GET /hotels`), KHÔNG hardcode.
 * Trước đây khối này liệt kê Singapore / Thái Lan / Hàn Quốc / Nhật Bản: sàn chỉ có khách sạn
 * ở Việt Nam nên bấm vào luôn ra 0 kết quả. Suy từ dữ liệu thật thì mỗi thẻ chắc chắn dẫn tới
 * một trang search có phòng, và tự cập nhật khi partner mở bán ở thành phố mới.
 */
export default function PopularVietnameseTourists() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  const { data, isLoading } = useSearchHotels({ limit: 50 });

  const destinations = useMemo<Destination[]>(() => {
    const byCity = new Map<string, Destination>();
    for (const hotel of data?.results ?? []) {
      const existing = byCity.get(hotel.city);
      if (existing) {
        existing.hotelCount += 1;
        existing.img ??= coverOf(hotel);
      } else {
        byCity.set(hotel.city, {
          city: hotel.city,
          hotelCount: 1,
          img: coverOf(hotel),
        });
      }
    }
    return [...byCity.values()]
      .sort((a, b) => b.hotelCount - a.hotelCount)
      .slice(0, 8);
  }, [data]);

  // Chưa có khách sạn nào đang bán → ẩn hẳn khối thay vì hiện lưới rỗng.
  if (!isLoading && destinations.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-8">
        {t('popular.title')}
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-36 sm:h-48 rounded-3xl bg-surface-container-low" />
              <div className="mt-3 h-4 w-2/3 rounded bg-surface-container-low" />
              <div className="mt-1.5 h-3 w-1/2 rounded bg-surface-container-low" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {destinations.map(dest => (
            <button
              key={dest.city}
              type="button"
              onClick={() => navigate(`/search?city=${encodeURIComponent(dest.city)}`)}
              className="group text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-3xl"
            >
              <div className="h-36 sm:h-48 rounded-3xl overflow-hidden mb-3 relative shadow-md bg-surface-container-low">
                {dest.img ? (
                  <img
                    alt={dest.city}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={dest.img}
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
        </div>
      )}
    </section>
  );
}
