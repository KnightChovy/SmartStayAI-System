import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import type { HotelSearchResult } from '@/types/hotel.types';
import { ROUTES } from '@/constants/routes';
import { useMoney } from '@/hooks/currency';
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
        </div>

        <p className="mt-2 flex items-center gap-1 text-sm text-on-surface-variant">
          <MapPin className="size-3.5 shrink-0" />
          <span className="line-clamp-1">
            {[hotel.address, hotel.city].filter(Boolean).join(', ')}
          </span>
        </p>

        {hotel.description && (
          <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant/80">{hotel.description}</p>
        )}

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-xs text-on-surface-variant">{t('room.from')}</p>
            <p className="font-be-vietnam text-xl font-bold text-on-surface">
              {format(hotel.minPrice)}
              <span className="text-sm font-normal text-on-surface-variant"> {t('room.perNight')}</span>
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
            {t('viewDetails')}
          </span>
        </div>
      </div>
    </Link>
  );
}
