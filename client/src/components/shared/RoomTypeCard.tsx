import { Bed, BedDouble, Check, Eye, Maximize, Star, Users } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { RoomType } from '@/types/hotel.types';
import { useMoney } from '@/hooks/currency';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import CancellationLine from './CancellationLine';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200&auto=format&fit=crop';

interface RoomTypeCardProps {
  roomType: RoomType;
  /** Có khoảng ngày → hiện tổng giá kỳ ở + số phòng trống + nút đặt. */
  onSelect?: (roomType: RoomType) => void;
  selectable?: boolean;
  /** Phòng rẻ nhất trong danh sách → gắn nhãn neo lựa chọn (Hick's law). */
  bestValue?: boolean;
  /** Link "xem chi tiết phòng" — không truyền thì thẻ không hiện link. */
  detailHref?: string;
  /** Số giờ hủy miễn phí (từ `hotel.settings.cancellation`) — hiện dòng chính sách hủy (SS-302). */
  freeUntilHours?: number | null;
}

/** Thẻ loại phòng trong trang chi tiết khách sạn. */
export default function RoomTypeCard({
  roomType,
  onSelect,
  selectable = false,
  bestValue = false,
  detailHref,
  freeUntilHours,
}: RoomTypeCardProps) {
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
  // `GET /hotels/:id/room-types` giờ trả TÁCH KHOẢN THẬT (subtotal + taxAmount + feeAmount
  // = totalPrice), tính bằng đúng hàm `computeTaxAndFees` lúc đặt ⇒ `totalPrice` ĐÃ GỒM
  // thuế/phí. Trước đây thẻ này coi `totalPrice` là tiền phòng thuần rồi ước tính thuế
  // cộng thêm lên trên → khách bị tính thuế HAI LẦN. Nay đọc thẳng số của BE, không ước tính.
  const taxFeeTotal =
    roomType.taxAmount != null && roomType.feeAmount != null
      ? Number(roomType.taxAmount) + Number(roomType.feeAmount)
      : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface md:flex-row">
      <div className="h-44 w-full shrink-0 overflow-hidden md:h-auto md:w-56">
        <img src={image} alt={roomType.name} loading="lazy" className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {/* h3: nằm dưới h2 "Available rooms" — không nhảy cấp (WCAG 1.3.1) */}
          <h3 className="font-be-vietnam text-lg font-semibold text-on-surface">
            {detailHref ? (
              <Link to={detailHref} className="hover:text-primary hover:underline">
                {roomType.name}
              </Link>
            ) : (
              roomType.name
            )}
          </h3>
          {bestValue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              <Star className="size-3 fill-current" aria-hidden="true" /> {t('room.bestValue')}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" aria-hidden="true" />{' '}
            {t('room.upTo', { count: roomType.maxOccupancy })}
            {/* Chi tiết sức chứa Pha-1: người lớn / trẻ em (BE đã trả sẵn) */}
            {(roomType.maxAdults != null || roomType.maxChildren != null) && (
              <span className="text-on-surface-variant/70">
                (
                {[
                  roomType.maxAdults != null
                    ? t('room.adults', { count: roomType.maxAdults })
                    : null,
                  roomType.maxChildren
                    ? t('room.children', { count: roomType.maxChildren })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                )
              </span>
            )}
          </span>
          {/* Giường: ưu tiên cấu hình chi tiết `beds`, fallback `bedType` cũ */}
          {roomType.beds && roomType.beds.length > 0 ? (
            <span className="flex items-center gap-1.5">
              <Bed className="size-4" aria-hidden="true" />
              {roomType.beds.map(b => `${b.quantity}× ${b.bedType.replace(/_/g, ' ')}`).join(', ')}
            </span>
          ) : (
            roomType.bedType && (
              <span className="flex items-center gap-1.5">
                <Bed className="size-4" aria-hidden="true" /> {roomType.bedType}
              </span>
            )
          )}
          {roomType.areaSqm && (
            <span className="flex items-center gap-1.5">
              <Maximize className="size-4" aria-hidden="true" /> {roomType.areaSqm}{' '}
              {roomType.sizeUnit === 'sqft' ? 'ft²' : 'm²'}
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

        {/* Chính sách hủy (SS-302) — chỉ hiện khi khách sạn đã khai */}
        <CancellationLine freeUntilHours={freeUntilHours} className="mt-3" />

        {roomType.description && (
          <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant/80">{roomType.description}</p>
        )}

        {/* Đặc điểm phòng Pha-1 — BE trả sẵn, trước đây guest không thấy */}
        {(roomType.hasBalcony || roomType.hasPrivateBathroom || roomType.isNonSmoking) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              roomType.hasBalcony ? t('room.balcony') : null,
              roomType.hasPrivateBathroom ? t('room.privateBathroom') : null,
              roomType.isNonSmoking ? t('room.nonSmoking') : null,
            ]
              .filter(Boolean)
              .map(label => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  <Check className="size-3" aria-hidden="true" /> {label}
                </span>
              ))}
          </div>
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
                {/* BE không tách khoản (`null`) → im lặng, không đoán thay khách sạn. */}
                {taxFeeTotal != null && (
                  <p className="text-xs text-on-surface-variant">
                    {taxFeeTotal > 0
                      ? t('room.inclTaxesFees', { amount: format(taxFeeTotal) })
                      : t('room.noExtraTaxes')}
                  </p>
                )}
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

          <div className="flex items-center gap-2">
            {detailHref && (
              <Button asChild size="lg" variant="cta-outline" className="min-h-11">
                <Link to={detailHref}>{t('room.viewDetails')}</Link>
              </Button>
            )}
            {selectable && (
              <Button
                size="lg"
                variant="cta"
                className="min-h-11"
                onClick={() => onSelect?.(roomType)}
              >
                {t('room.bookNow')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
