import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BedDouble, MapPin } from 'lucide-react';
import type { HotelSearchResult } from '@/types/hotel.types';
import { ROUTES } from '@/constants/routes';
import { useMoney } from '@/hooks/currency';
import { cn } from '@/lib/cn';
import { scoreColorClass, scoreLabelKey } from '@/utils/reviewScore';
import StarRating from './StarRating';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop';

interface HotelCardProps {
  hotel: HotelSearchResult;
  /** Query string ngày/khách để mang theo khi mở trang chi tiết. */
  searchQuery?: string;
}

/** Thẻ khách sạn trong trang kết quả tìm kiếm. */
export default function HotelCard({ hotel, searchQuery = '' }: HotelCardProps) {
  const { t } = useTranslation('hotel');
  const { format } = useMoney();
  const cover = hotel.images?.[0]?.url ?? FALLBACK_IMAGE;
  const detailUrl = `${ROUTES.hotelDetail(hotel.id)}${searchQuery}`;

  const avg = hotel.avgRating;
  const topAmenities = hotel.topAmenities ?? [];
  const available = hotel.availableRooms;
  // Chỉ hiện badge khan hiếm khi thực sự sắp hết (≤ 5) — quảng cáo "còn nhiều" làm giảm cấp bách.
  const showScarcity = available != null && available > 0 && available <= 5;
  const isLowStock = showScarcity && available <= 3;

  return (
    <Link
      to={detailUrl}
      className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface transition-all hover:-translate-y-0.5 hover:shadow-xl sm:flex-row"
    >
      <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-64">
        <img
          src={cover}
          alt={hotel.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-be-vietnam text-lg font-semibold text-on-surface group-hover:text-primary">
              {hotel.name}
            </h3>
            {hotel.starRating ? <StarRating value={hotel.starRating} size={14} className="mt-1" /> : null}
          </div>
          {/* Điểm đánh giá của khách (SS-005) — khác hạng sao ở trên */}
          {avg != null ? (
            <div className="flex shrink-0 items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-on-surface">{t(scoreLabelKey(avg))}</p>
                <p className="text-xs text-on-surface-variant">
                  {t('reviews.count', { count: hotel.reviewCount ?? 0 })}
                </p>
              </div>
              {/* Badge điểm to/đậm, màu theo mức — KHÔNG có icon sao để không lẫn với hạng sao KS */}
              <span
                className={cn(
                  'rounded-lg px-2.5 py-1 text-base font-extrabold tabular-nums shadow-sm',
                  scoreColorClass(avg)
                )}
              >
                {avg.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="shrink-0 text-xs text-on-surface-variant">{t('noRatingYet')}</span>
          )}
        </div>

        <p className="mt-2 flex items-center gap-1 text-sm text-on-surface-variant">
          <MapPin className="size-3.5 shrink-0" />
          <span className="line-clamp-1">
            {[hotel.address, hotel.city].filter(Boolean).join(', ')}
          </span>
        </p>

        {/* Top 3 tiện nghi (SS-102) */}
        {topAmenities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topAmenities.slice(0, 3).map(a => (
              <span
                key={a.id}
                className="rounded-full bg-primary/5 px-2.5 py-0.5 text-xs text-on-surface-variant"
              >
                {a.name}
              </span>
            ))}
          </div>
        )}

        {hotel.description && (
          <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant/80">{hotel.description}</p>
        )}

        {/* Badge urgency phòng trống (SS-102) */}
        {showScarcity && (
          <span
            className={cn(
              'mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
              isLowStock ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'
            )}
          >
            <BedDouble className="size-3.5" aria-hidden="true" />
            {isLowStock
              ? t('room.roomsLeft', { count: available })
              : t('room.roomsAvailable', { count: available })}
          </span>
        )}

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-xs text-on-surface-variant">{t('room.from')}</p>
            <p className="font-be-vietnam text-xl font-bold text-on-surface">
              {format(hotel.minPrice)}
              <span className="text-sm font-normal text-on-surface-variant"> {t('room.perNight')}</span>
            </p>
          </div>
          {/* Chữ để màu tối, không phải `text-premium-gold`: vàng trên nền trắng chỉ đạt
              contrast 2.0:1 nên chữ sẽ mờ khó đọc. */}
          <span className="rounded-full bg-premium-gold/20 px-4 py-2 text-sm font-semibold text-on-surface transition-colors group-hover:bg-premium-gold">
            {t('viewDetails')}
          </span>
        </div>
      </div>
    </Link>
  );
}
