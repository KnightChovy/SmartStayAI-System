import { Bed, BedDouble, Eye, Maximize, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RoomType } from '@/types/hotel.types';
import { useMoney } from '@/hooks/currency';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200&auto=format&fit=crop';

interface RoomTypeCardProps {
  roomType: RoomType;
  /** Có khoảng ngày → hiện tổng giá kỳ ở + số phòng trống + nút đặt. */
  onSelect?: (roomType: RoomType) => void;
  selectable?: boolean;
}

/** Thẻ loại phòng trong trang chi tiết khách sạn. */
export default function RoomTypeCard({ roomType, onSelect, selectable = false }: RoomTypeCardProps) {
  const { t } = useTranslation('hotel');
  const { format } = useMoney();
  const image = roomType.images?.[0]?.url ?? FALLBACK_IMAGE;
  const amenities = roomType.amenities?.map(a => a.amenity) ?? [];
  const hasStayQuote = roomType.totalPrice !== undefined;
  const availableRooms = roomType.availableRooms ?? 0;
  // Sắp hết phòng (≤ 3) → badge tông đỏ tạo cảm giác cần đặt sớm
  const isLowStock = hasStayQuote && availableRooms > 0 && availableRooms <= 3;
  // Chỉ hiện số phòng khi thực sự khan hiếm (≤ 5). Quảng cáo "còn nhiều phòng"
  // làm GIẢM tính cấp bách nên không hiển thị gì khi còn dư.
  const showScarcity = hasStayQuote && availableRooms > 0 && availableRooms <= 5;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface md:flex-row">
      <div className="h-44 w-full shrink-0 overflow-hidden md:h-auto md:w-56">
        <img src={image} alt={roomType.name} loading="lazy" className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* h3: nằm dưới h2 "Available rooms" — không nhảy cấp (WCAG 1.3.1) */}
        <h3 className="font-be-vietnam text-lg font-semibold text-on-surface">{roomType.name}</h3>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" /> {t('room.upTo', { count: roomType.maxOccupancy })}
          </span>
          {roomType.bedType && (
            <span className="flex items-center gap-1.5">
              <Bed className="size-4" /> {roomType.bedType}
            </span>
          )}
          {roomType.areaSqm && (
            <span className="flex items-center gap-1.5">
              <Maximize className="size-4" /> {roomType.areaSqm} m²
            </span>
          )}
          {roomType.viewType && (
            <span className="flex items-center gap-1.5">
              <Eye className="size-4" /> {roomType.viewType}
            </span>
          )}
        </div>

        {/* Badge khan hiếm — chỉ hiện khi còn ≤ 5 phòng (xem `showScarcity`) */}
        {showScarcity && (
          <span
            className={cn(
              'mt-3 inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold',
              isLowStock ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'
            )}
          >
            <BedDouble className="size-4" aria-hidden="true" />
            {isLowStock
              ? t('room.roomsLeft', { count: availableRooms })
              : t('room.roomsAvailable', { count: availableRooms })}
          </span>
        )}

        {roomType.description && (
          <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant/80">{roomType.description}</p>
        )}

        {amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {amenities.slice(0, 5).map(a => (
              <span
                key={a.id}
                className="rounded-full bg-primary/5 px-2.5 py-1 text-xs text-on-surface-variant"
              >
                {a.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div>
            {hasStayQuote ? (
              <>
                <p className="text-xs text-on-surface-variant">
                  {t('room.nightsTotal', { count: roomType.numNights ?? 0 })} ·{' '}
                  {t('room.totalSuffix')}
                </p>
                <p className="font-be-vietnam text-xl font-bold text-on-surface">
                  {format(roomType.totalPrice)}
                </p>
                {/* Minh bạch giá: nói rõ tổng đã gồm thuế & phí, không để "total" mơ hồ */}
                <p className="text-xs text-on-surface-variant">{t('room.inclTaxes')}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-on-surface-variant">{t('room.from')}</p>
                <p className="font-be-vietnam text-xl font-bold text-on-surface">
                  {format(roomType.basePrice)}
                  <span className="text-sm font-normal text-on-surface-variant"> {t('room.perNight')}</span>
                </p>
              </>
            )}
          </div>

          {selectable && (
            <Button
              size="lg"
              className="min-h-11 bg-primary text-on-primary hover:bg-primary/90"
              onClick={() => onSelect?.(roomType)}
            >
              {t('room.bookNow')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
