import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bed, BedDouble, Check, Clock, Eye, MapPin, Maximize, Users } from 'lucide-react';
import { useRoomType } from '@/hooks/hotels';
import { useHotel } from '@/hooks/hotels/use-hotel';
import { useMoney } from '@/hooks/currency';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import StarRating from '@/components/shared/StarRating';
import BackLink from '@/components/shared/BackLink';
import Breadcrumb, { type Crumb } from '@/components/shared/Breadcrumb';
import EmptyState from '@/components/shared/EmptyState';
import RoomGallery from '@/components/guest/RoomGallery';
import CancellationLine from '@/components/shared/CancellationLine';
import { getFreeCancellationHours } from '@/utils/cancellationPolicy';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/utils/formatAddress';
import type { RoomType } from '@/types/hotel.types';
import { cn } from '@/lib/cn';

const FALLBACK =
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1600&auto=format&fit=crop';

/**
 * Chi tiết một loại phòng (`GET /hotels/:hotelId/room-types/:roomTypeId`) — public.
 *
 * Giá đọc THẲNG số BE trả (`subtotal` + `taxAmount` + `feeAmount` = `totalPrice`, tính bằng
 * đúng `computeTaxAndFees` lúc đặt) nên trùng khớp thẻ phòng ở trang chi tiết khách sạn.
 * TUYỆT ĐỐI không ước tính thêm thuế lên `totalPrice` — số đó ĐÃ gồm thuế/phí.
 */
export default function RoomDetailPage() {
  const { t } = useTranslation('hotel');
  const { t: tc } = useTranslation('common');
  const { hotelId, roomTypeId } = useParams<{ hotelId: string; roomTypeId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { format } = useMoney();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const checkIn = params.get('checkIn') ?? '';
  const checkOut = params.get('checkOut') ?? '';
  // Khách tách người lớn / trẻ em; link cũ chỉ có `guests` ⇒ coi toàn bộ là người lớn.
  const adults = Number(params.get('adults')) || Number(params.get('guests')) || 1;
  const children = Number(params.get('children')) || 0;

  const {
    data: roomType,
    isLoading,
    isError,
  } = useRoomType(hotelId, roomTypeId, { checkIn, checkOut, adults, children });

  // Lấy `HotelDetail` cho breadcrumb + chính sách huỷ + state sang checkout. Dùng chung query
  // key với trang chi tiết KS nên thường ăn cache, không tốn request thừa.
  const { data: hotelDetail } = useHotel(hotelId ?? '');

  const gallery = useMemo(() => {
    const imgs = roomType?.images?.map(i => i.url) ?? [];
    return imgs.length ? imgs : [FALLBACK];
  }, [roomType]);

  const hasStayQuote = roomType?.totalPrice != null;
  // `totalPrice` của BE = subtotal + thuế + phí (SỐ CUỐI khách trả). Bản cũ coi nó là tiền phòng
  // thuần rồi cộng thuế ước tính lên trên ⇒ THUẾ TÍNH HAI LẦN: phòng 1.022.000 ở trang chi tiết
  // KS bị đội lên 1.153.760 ở trang này.
  const total = Number(roomType?.totalPrice ?? 0);
  const taxFee =
    roomType?.taxAmount != null && roomType?.feeAmount != null
      ? Number(roomType.taxAmount) + Number(roomType.feeAmount)
      : null;

  const handleBook = () => {
    if (!roomType) return;
    // Truyền NGUYÊN VẸN: endpoint chi tiết giờ trả cùng shape giá với endpoint danh sách
    // (`subtotal`/`taxAmount`/`feeAmount`/`totalPrice`) nên checkout đọc thẳng số thật của BE.
    const bookingState = {
      hotel: hotelDetail,
      roomType: roomType as RoomType,
      checkIn,
      checkOut,
      adults,
      children,
    };
    if (!isAuthenticated) {
      navigate(ROUTES.login, {
        state: { from: { pathname: ROUTES.booking }, booking: bookingState },
      });
      return;
    }
    navigate(ROUTES.booking, { state: bookingState });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-margin-mobile py-10 md:px-8">
        <Skeleton className="h-96 w-full rounded-3xl" />
        <Skeleton className="mt-6 h-8 w-1/2" />
        <Skeleton className="mt-3 h-4 w-1/3" />
      </div>
    );
  }

  // 404 khi phòng đã tắt hoặc khách sạn chưa mở bán — nói thật thay vì trang trắng.
  if (isError || !roomType) {
    return (
      <div className="mx-auto max-w-2xl px-margin-mobile py-16 md:px-8">
        <EmptyState
          icon={BedDouble}
          title={t('roomDetail.notFoundTitle')}
          description={t('roomDetail.notFoundDesc')}
          action={
            <Button
              className="bg-on-surface text-white hover:bg-primary"
              onClick={() => navigate(ROUTES.hotelDetail(hotelId ?? ''))}
            >
              {t('roomDetail.backToHotel')}
            </Button>
          }
        />
      </div>
    );
  }

  // Breadcrumb: Trang chủ / Thành phố / Khách sạn / Loại phòng (SS-702).
  // Link về khách sạn giữ nguyên query (ngày/khách) để không mất bối cảnh.
  const searchQ = params.toString();
  const crumbs: Crumb[] = [
    { label: tc('nav.home'), to: ROUTES.home },
    ...(roomType.hotel.city
      ? [{ label: roomType.hotel.city, to: `${ROUTES.search}?city=${encodeURIComponent(roomType.hotel.city)}` }]
      : []),
    {
      label: roomType.hotel.name,
      to: `${ROUTES.hotelDetail(roomType.hotelId)}${searchQ ? `?${searchQ}` : ''}`,
    },
    { label: roomType.name },
  ];

  const amenities = roomType.amenities?.map(a => a.amenity) ?? [];
  const features = [
    roomType.hasBalcony ? t('room.balcony') : null,
    roomType.hasPrivateBathroom ? t('room.privateBathroom') : null,
    roomType.isNonSmoking ? t('room.nonSmoking') : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-5xl px-margin-mobile py-6 md:px-8 md:py-10">
      <BackLink fallbackTo={ROUTES.hotelDetail(roomType.hotelId)} />
      <Breadcrumb items={crumbs} className="mb-4" />

      {/* ----- Gallery thích ứng theo số ảnh (SS-301) ----- */}
      <RoomGallery images={gallery} altBase={roomType.name} className="mt-4" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ----- Nội dung ----- */}
        <div>
          <h1 className="font-be-vietnam text-2xl font-bold text-on-surface md:text-3xl">
            {roomType.name}
          </h1>

          {/* Khách sạn chứa phòng này — BE trả kèm ở `roomType.hotel` */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-surface-variant">
            {roomType.hotel.starRating != null && <StarRating value={roomType.hotel.starRating} />}
            <span className="font-medium text-on-surface">{roomType.hotel.name}</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {formatAddress(
                roomType.hotel.address,
                undefined,
                roomType.hotel.city,
                roomType.hotel.country
              )}
            </span>
          </div>

          {(roomType.hotel.checkInTime || roomType.hotel.checkOutTime) && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Clock className="size-4" aria-hidden="true" />
              {t('roomDetail.checkInOut', {
                checkIn: roomType.hotel.checkInTime ?? '—',
                checkOut: roomType.hotel.checkOutTime ?? '—',
              })}
            </p>
          )}

          {/* ----- Thông số phòng ----- */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Spec icon={Users} label={t('roomDetail.occupancy')}>
              {t('room.upTo', { count: roomType.maxOccupancy })}
            </Spec>
            {(roomType.beds?.length ?? 0) > 0 ? (
              <Spec icon={Bed} label={t('roomDetail.beds')}>
                {roomType.beds!.map(b => `${b.quantity}× ${b.bedType.replace(/_/g, ' ')}`).join(', ')}
              </Spec>
            ) : (
              roomType.bedType && (
                <Spec icon={Bed} label={t('roomDetail.beds')}>
                  {roomType.bedType}
                </Spec>
              )
            )}
            {roomType.areaSqm && (
              <Spec icon={Maximize} label={t('roomDetail.size')}>
                {roomType.areaSqm} {roomType.sizeUnit === 'sqft' ? 'ft²' : 'm²'}
              </Spec>
            )}
            {roomType.viewType && (
              <Spec icon={Eye} label={t('roomDetail.view')}>
                {roomType.viewType}
              </Spec>
            )}
          </div>

          {roomType.description && (
            <section className="mt-8">
              <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">
                {t('roomDetail.about')}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
                {roomType.description}
              </p>
            </section>
          )}

          {features.length > 0 && (
            <section className="mt-8">
              <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">
                {t('roomDetail.highlights')}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {features.map(label => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700"
                  >
                    <Check className="size-3.5" aria-hidden="true" /> {label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {amenities.length > 0 && (
            <section className="mt-8">
              <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">
                {t('roomDetail.amenities')}
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {amenities.map(a => (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 text-sm text-on-surface-variant"
                  >
                    <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    {a.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ----- Hộp giá + đặt phòng ----- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
            {hasStayQuote ? (
              <>
                <p className="text-xs text-on-surface-variant">
                  {t('room.nightsTotal', { count: roomType.numNights ?? 0 })}
                </p>
                <p className="mt-1 font-be-vietnam text-2xl font-bold text-on-surface">
                  {format(total)}
                </p>
                {/* BE không tách khoản (`null`) → im lặng, không đoán thay khách sạn. */}
                {taxFee != null && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {taxFee > 0
                      ? t('room.inclTaxesFees', { amount: format(taxFee) })
                      : t('room.noExtraTaxes')}
                  </p>
                )}

                {(roomType.availableRooms ?? 0) > 0 ? (
                  (roomType.availableRooms ?? 0) <= 5 && (
                    <span
                      className={cn(
                        'mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold',
                        (roomType.availableRooms ?? 0) <= 3
                          ? 'bg-error/10 text-error'
                          : 'bg-tertiary/10 text-tertiary'
                      )}
                    >
                      <BedDouble className="size-4" aria-hidden="true" />
                      {(roomType.availableRooms ?? 0) <= 3
                        ? t('room.roomsLeft', { count: roomType.availableRooms ?? 0 })
                        : t('room.roomsAvailable', { count: roomType.availableRooms ?? 0 })}
                    </span>
                  )
                ) : (
                  <p className="mt-3 rounded-xl bg-error/5 px-3 py-2 text-sm text-error">
                    {t('roomDetail.soldOut')}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-on-surface-variant">{t('room.from')}</p>
                <p className="mt-1 font-be-vietnam text-2xl font-bold text-on-surface">
                  {format(roomType.basePrice)}
                  <span className="text-sm font-normal text-on-surface-variant">
                    {' '}
                    {t('room.perNight')}
                  </span>
                </p>
                <p className="mt-2 text-xs text-on-surface-variant">{t('roomDetail.pickDates')}</p>
              </>
            )}

            <Button
              size="lg"
              variant="cta"
              className="mt-4 min-h-11 w-full"
              onClick={handleBook}
              disabled={hasStayQuote && (roomType.availableRooms ?? 0) === 0}
            >
              {t('room.bookNow')}
            </Button>

            {/* Chính sách hủy (SS-302) */}
            <CancellationLine
              freeUntilHours={
                hotelDetail?.cancellationRule?.freeUntilHours ??
                getFreeCancellationHours(hotelDetail?.settings)
              }
              className="mt-3 justify-center"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Ô thông số nhỏ (sức chứa / giường / diện tích / hướng nhìn). */
function Spec({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/30 p-3">
      <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <Icon className="size-3.5" aria-hidden="true" /> {label}
      </p>
      <p className="mt-1 text-sm font-medium text-on-surface">{children}</p>
    </div>
  );
}
