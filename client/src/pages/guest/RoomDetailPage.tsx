import { useMemo, useState } from 'react';
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
import EmptyState from '@/components/shared/EmptyState';
import GalleryLightbox from '@/components/guest/GalleryLightbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/utils/formatAddress';
import { estimateTaxAndFees } from '@/utils/estimateTaxAndFees';
import type { RoomType } from '@/types/hotel.types';
import { cn } from '@/lib/cn';

const FALLBACK =
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1600&auto=format&fit=crop';

/**
 * Chi tiết một loại phòng (`GET /hotels/:hotelId/room-types/:roomTypeId`) — public.
 *
 * ⚠️ Giá: endpoint chi tiết trả `totalPrice` là **tiền phòng thuần** (khác endpoint danh sách
 * vốn đã gồm thuế/phí) và KHÔNG trả `taxAmount`/`feeAmount`, nên trang này phải tự ước tính
 * thuế từ `policies` của khách sạn — giống trang checkout. Số chốt vẫn là `POST /bookings`.
 */
export default function RoomDetailPage() {
  const { t } = useTranslation('hotel');
  const { hotelId, roomTypeId } = useParams<{ hotelId: string; roomTypeId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { format } = useMoney();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const checkIn = params.get('checkIn') ?? '';
  const checkOut = params.get('checkOut') ?? '';
  const guests = Number(params.get('guests')) || 1;

  const {
    data: roomType,
    isLoading,
    isError,
  } = useRoomType(hotelId, roomTypeId, { checkIn, checkOut });

  // Cần `charges` (thuế/phí) để ước tính giá cuối — endpoint chi tiết phòng KHÔNG trả thuế.
  // Dùng chung query key với trang chi tiết KS nên thường ăn cache, không tốn request thừa.
  const { data: hotelDetail, isPlaceholderData } = useHotel(hotelId ?? '');
  // `useHotel` dựng placeholder với các relation RỖNG → đọc lúc chưa có data thật sẽ tính ra
  // "không thuế" cho KS có VAT. Chưa về ⇒ `undefined` = chưa biết ⇒ im lặng, không đoán.
  const charges = isPlaceholderData ? undefined : hotelDetail?.charges;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const gallery = useMemo(() => {
    const imgs = roomType?.images?.map(i => i.url) ?? [];
    return imgs.length ? imgs : [FALLBACK];
  }, [roomType]);

  const hasStayQuote = roomType?.totalPrice != null;
  const subtotal = Number(roomType?.totalPrice ?? 0);
  const taxFee = estimateTaxAndFees({
    charges,
    subtotal,
    numNights: roomType?.numNights ?? 0,
    numGuests: guests,
  });
  const total = taxFee ? taxFee.total : subtotal;

  const handleBook = () => {
    if (!roomType) return;
    // Checkout nhận `RoomType` (shape của endpoint DANH SÁCH). Endpoint chi tiết trả tiền
    // phòng thuần ở `totalPrice` ⇒ map sang `subtotal` cho đúng nghĩa, và để `totalPrice`
    // trống (số đó ở đây CHƯA gồm thuế nên không được coi là tổng) — checkout sẽ ước tính
    // thuế từ `policies` như luồng thường.
    const bookable: RoomType = {
      ...roomType,
      subtotal: roomType.totalPrice ?? undefined,
      totalPrice: undefined,
    };
    const bookingState = {
      hotel: hotelDetail,
      roomType: bookable,
      checkIn,
      checkOut,
      guests,
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

  const amenities = roomType.amenities?.map(a => a.amenity) ?? [];
  const features = [
    roomType.hasBalcony ? t('room.balcony') : null,
    roomType.hasPrivateBathroom ? t('room.privateBathroom') : null,
    roomType.isNonSmoking ? t('room.nonSmoking') : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-5xl px-margin-mobile py-6 md:px-8 md:py-10">
      <BackLink fallbackTo={ROUTES.hotelDetail(roomType.hotelId)} />

      {/* ----- Gallery ----- */}
      <div className="mt-4 grid gap-2 md:grid-cols-4 md:grid-rows-2">
        <button
          type="button"
          onClick={() => {
            setActiveImage(0);
            setLightboxOpen(true);
          }}
          className="relative col-span-2 row-span-2 h-64 overflow-hidden rounded-2xl md:h-full"
        >
          <img
            src={gallery[0]}
            alt={roomType.name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </button>
        {gallery.slice(1, 5).map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => {
              setActiveImage(i + 1);
              setLightboxOpen(true);
            }}
            className="hidden h-32 overflow-hidden rounded-2xl md:block"
          >
            <img
              src={url}
              alt={`${roomType.name} ${i + 2}`}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </button>
        ))}
      </div>

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
                {/* Chưa biết chính sách → không nói gì về thuế (không đoán thay khách sạn) */}
                {taxFee && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {taxFee.taxAmount + taxFee.feeAmount > 0
                      ? t('roomDetail.estIncludesTaxes', {
                          amount: format(taxFee.taxAmount + taxFee.feeAmount),
                        })
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
              className="mt-4 min-h-11 w-full bg-primary text-on-primary hover:bg-primary/90"
              onClick={handleBook}
              disabled={hasStayQuote && (roomType.availableRooms ?? 0) === 0}
            >
              {t('room.bookNow')}
            </Button>
          </div>
        </aside>
      </div>

      <GalleryLightbox
        open={lightboxOpen}
        images={gallery}
        index={activeImage}
        onIndexChange={setActiveImage}
        hotelName={roomType.hotel.name}
        onClose={() => setLightboxOpen(false)}
      />
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
