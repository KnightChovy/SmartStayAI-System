import { Bed, BedDouble, Eye, Maximize, Users } from 'lucide-react';
import type { RoomType } from '@/types/hotel.types';
import { formatCurrency } from '@/utils/formatCurrency';
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
  const image = roomType.images?.[0]?.url ?? FALLBACK_IMAGE;
  const amenities = roomType.amenities?.map(a => a.amenity) ?? [];
  const hasStayQuote = roomType.totalPrice !== undefined;
  const availableRooms = roomType.availableRooms ?? 0;
  // Sắp hết phòng (≤ 3) → badge tông đỏ tạo cảm giác cần đặt sớm
  const isLowStock = hasStayQuote && availableRooms > 0 && availableRooms <= 3;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface md:flex-row">
      <div className="h-44 w-full shrink-0 overflow-hidden md:h-auto md:w-56">
        <img src={image} alt={roomType.name} loading="lazy" className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h4 className="font-be-vietnam text-lg font-semibold text-on-surface">{roomType.name}</h4>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" /> Up to {roomType.maxOccupancy}
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

        {/* Badge số phòng trống — chỉ hiện khi đã chọn ngày (có quote tồn kho) */}
        {hasStayQuote && (
          <span
            className={cn(
              'mt-3 inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold',
              isLowStock ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'
            )}
          >
            <BedDouble className="size-4" />
            {isLowStock
              ? `Only ${availableRooms} room${availableRooms === 1 ? '' : 's'} left!`
              : `${availableRooms} rooms available`}
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
                  {roomType.numNights} night{roomType.numNights === 1 ? '' : 's'} total
                </p>
                <p className="font-be-vietnam text-xl font-bold text-on-surface">
                  {formatCurrency(roomType.totalPrice)}
                  <span className="text-sm font-normal text-on-surface-variant"> total</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-on-surface-variant">From</p>
                <p className="font-be-vietnam text-xl font-bold text-on-surface">
                  {formatCurrency(roomType.basePrice)}
                  <span className="text-sm font-normal text-on-surface-variant"> / night</span>
                </p>
              </>
            )}
          </div>

          {selectable && (
            <Button
              size="lg"
              className="bg-primary text-on-primary hover:bg-primary/90"
              onClick={() => onSelect?.(roomType)}
            >
              Book now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
