import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  Clock,
  Columns3,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  Star,
  Ticket,
} from 'lucide-react';
import { useHotel } from '@/hooks/hotels/use-hotel';
import { useRoomTypes } from '@/hooks/hotels/use-room-types';
import { usePublicHotelReviews } from '@/hooks/hotel-reviews';
import AnchorNav, { type AnchorSection } from '@/components/guest/AnchorNav';
import { useGeocode } from '@/hooks/geo';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import StarRating from '@/components/shared/StarRating';
import RoomTypeCard from '@/components/shared/RoomTypeCard';
import HotelMap from '@/components/shared/HotelMap';
import EmptyState from '@/components/shared/EmptyState';
import HotelReviews from '@/components/guest/HotelReviews';
import HotelAmenities from '@/components/guest/HotelAmenities';
import HotelPolicies from '@/components/guest/HotelPolicies';
import BackLink from '@/components/shared/BackLink';
import Breadcrumb, { type Crumb } from '@/components/shared/Breadcrumb';
import HotelNearby from '@/components/guest/HotelNearby';
import StickyBookingBar from '@/components/guest/StickyBookingBar';
import GalleryLightbox from '@/components/guest/GalleryLightbox';
import RoomCompareTable from '@/components/guest/RoomCompareTable';
import DateRangePicker from '@/components/shared/DateRangePicker';
import GuestSelector from '@/components/shared/GuestSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toDateInputValue } from '@/utils/formatDate';
import { formatAddress } from '@/utils/formatAddress';
import { getFreeCancellationHours } from '@/utils/cancellationPolicy';
import type { HotelSearchResult, RoomType } from '@/types/hotel.types';

const FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop';

export default function HotelDetailPage() {
  const { t } = useTranslation('hotel');
  const { t: tc } = useTranslation('common');
  const { hotelId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Hotel summary có thể đã được truyền qua router state từ trang search
  const stateHotel = (location.state as { hotel?: HotelSearchResult } | null)?.hotel ?? null;
  const { data: hotel, isLoading: hotelLoading } = useHotel(hotelId, stateHotel);
  // Không còn ước tính thuế ở đây nữa: `GET /hotels/:id/room-types` đã trả thuế/phí THẬT
  // (`taxAmount`/`feeAmount`) nên `RoomTypeCard` đọc thẳng số của BE. Nhờ vậy cũng hết phải
  // canh `isPlaceholderData` để tránh đọc nhầm `policies: []` bịa ra từ placeholder.

  const checkIn = params.get('checkIn') ?? '';
  const checkOut = params.get('checkOut') ?? '';
  const guests = params.get('guests') ? Number(params.get('guests')) : 2;

  // Mở trang chi tiết mà chưa chọn ngày → mặc định hôm nay → mai và ghi vào URL,
  // để thấy ngay số phòng trống + tổng giá và luồng đặt phòng có sẵn ngày hợp lệ.
  useEffect(() => {
    if (checkIn && checkOut) return;
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const next = new URLSearchParams(params);
    next.set('checkIn', toDateInputValue(today));
    next.set('checkOut', toDateInputValue(tomorrow));
    if (!params.get('guests')) next.set('guests', String(guests));
    setParams(next, { replace: true });
  }, [checkIn, checkOut, guests, params, setParams]);

  const roomParams = useMemo(
    () => ({
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests,
    }),
    [checkIn, checkOut, guests]
  );
  const { data: roomTypes, isLoading: roomsLoading } = useRoomTypes(hotelId, roomParams);

  /** Ngày/số khách đang chọn, mang sang trang chi tiết phòng để nó báo đúng giá kỳ ở. */
  const roomQuery = useMemo(() => {
    const q = new URLSearchParams();
    if (checkIn) q.set('checkIn', checkIn);
    if (checkOut) q.set('checkOut', checkOut);
    q.set('guests', String(guests));
    return q.toString();
  }, [checkIn, checkOut, guests]);

  // Giá "từ" cho thanh sticky: `GET /hotels/:id` không trả `minPrice` (field đó chỉ có ở
  // list search), nên suy từ basePrice thấp nhất của các loại phòng đang hiển thị.
  const fromPrice = useMemo(() => {
    const prices = (roomTypes ?? []).map(rt => Number(rt.basePrice)).filter(p => p > 0);
    if (prices.length === 0) return hotel?.minPrice ?? null;
    return String(Math.min(...prices));
  }, [roomTypes, hotel]);

  /** Phòng rẻ nhất → gắn nhãn "Best value" để neo lựa chọn (giảm tê liệt quyết định). */
  const bestValueRoomId = useMemo(() => {
    const priced = (roomTypes ?? []).filter(rt => Number(rt.totalPrice ?? rt.basePrice) > 0);
    if (priced.length < 2) return null;
    return priced.reduce((min, rt) =>
      Number(rt.totalPrice ?? rt.basePrice) < Number(min.totalPrice ?? min.basePrice) ? rt : min
    ).id;
  }, [roomTypes]);

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  // Gallery: ảnh khách sạn + ảnh đại diện từng loại phòng
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const gallery = useMemo(() => {
    const imgs = [
      ...(hotel?.images?.map(i => i.url) ?? []),
      ...(roomTypes?.flatMap(rt => rt.images?.map(i => i.url) ?? []) ?? []),
    ];
    return imgs.length ? [...new Set(imgs)] : [FALLBACK];
  }, [hotel, roomTypes]);

  // Toạ độ map: ưu tiên DB; nếu seed chưa có lat/lng thì geocode từ địa chỉ (VietMap).
  const fullAddress = hotel
    ? formatAddress(hotel.address, hotel.district, hotel.city, hotel.country)
    : '';
  const hasDbCoords = Boolean(hotel?.latitude && hotel?.longitude);
  const { data: geocoded } = useGeocode(fullAddress, Boolean(hotel) && !hasDbCoords);
  const mapLat = hotel?.latitude != null ? Number(hotel.latitude) : geocoded?.lat ?? null;
  const mapLng = hotel?.longitude != null ? Number(hotel.longitude) : geocoded?.lng ?? null;

  // Điểm đánh giá tổng cho header (SS-201). Dùng cùng tham số với <HotelReviews/> nên React Query
  // dùng chung cache — không phát sinh request thừa. avgRating = null khi chưa có review (không hiện 0).
  const { data: reviewData } = usePublicHotelReviews(hotelId, {
    limit: 100,
    sortBy: 'createdAt:desc',
  });
  const reviewCount = reviewData?.totalResults ?? 0;
  const avgRating = useMemo(() => {
    const list = reviewData?.results ?? [];
    if (list.length === 0) return null;
    return list.reduce((sum, r) => sum + r.overallRating, 0) / list.length;
  }, [reviewData]);

  // Chỉ hiện anchor cho section thực sự tồn tại (tránh cuộn tới chỗ trống).
  const hasLocation =
    (mapLat != null && mapLng != null) || (hotel?.nearbyPlaces?.length ?? 0) > 0;
  const sections = useMemo<AnchorSection[]>(() => {
    const list: AnchorSection[] = [{ id: 'overview', label: t('anchorNav.overview') }];
    if (hotel?.amenities?.length) list.push({ id: 'amenities', label: t('anchorNav.amenities') });
    if (hasLocation) list.push({ id: 'location', label: t('anchorNav.location') });
    list.push({ id: 'rooms', label: t('anchorNav.rooms') });
    list.push({ id: 'reviews', label: t('anchorNav.reviews') });
    return list;
  }, [hotel?.amenities?.length, hasLocation, t]);

  // Breadcrumb phân cấp: Trang chủ / Thành phố / Khách sạn (SS-702).
  // Const thường (không useMemo) — React Compiler tự memo; chỉ dùng để render, không vào effect nào.
  const crumbs: Crumb[] = [
    { label: tc('nav.home'), to: ROUTES.home },
    ...(hotel?.city
      ? [{ label: hotel.city, to: `${ROUTES.search}?city=${encodeURIComponent(hotel.city)}` }]
      : []),
    { label: hotel?.name ?? '' },
  ];

  const handleSelectRoom = (roomType: RoomType) => {
    if (!checkIn || !checkOut) {
      // Chưa chọn ngày → cuộn lên thanh chọn ngày
      document.getElementById('stay-picker')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const target = ROUTES.booking;
    const bookingState = { hotel, roomType, checkIn, checkOut, guests };
    if (!isAuthenticated) {
      navigate(ROUTES.login, { state: { from: { pathname: target }, booking: bookingState } });
      return;
    }
    navigate(target, { state: bookingState });
  };

  if (hotelLoading && !hotel) {
    return (
      <div className="mx-auto max-w-7xl px-margin-mobile py-10 md:px-8">
        <Skeleton className="h-96 w-full rounded-3xl" />
        <Skeleton className="mt-6 h-8 w-1/2" />
      </div>
    );
  }

  return (
    // pb lớn để thanh sticky (giá + CTA) không che nội dung cuối trang
    <div className="w-full py-8 pb-28">
      <div className="mx-auto max-w-7xl px-margin-mobile md:px-8">
        <BackLink fallbackTo={ROUTES.search} />
        <Breadcrumb items={crumbs} className="mb-4" />

        {/* Gallery — click bất kỳ ảnh nào để mở lightbox toàn màn hình (vuốt / ←→ / Esc) */}
        <div className="relative grid gap-3 md:grid-cols-4 md:grid-rows-2">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="overflow-hidden rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:col-span-2 md:row-span-2"
          >
            <img
              src={gallery[activeImage]}
              alt={t('galleryAlt', {
                name: hotel?.name ?? '',
                index: activeImage + 1,
                total: gallery.length,
              })}
              className="h-72 w-full object-cover md:h-full"
            />
          </button>
          {gallery.slice(0, 4).map((url, i) => (
            <button
              key={url + i}
              onClick={() => {
                setActiveImage(gallery.indexOf(url));
                setLightboxOpen(true);
              }}
              className="hidden overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:block"
            >
              <img
                src={url}
                alt={t('galleryAlt', {
                  name: hotel?.name ?? '',
                  index: i + 1,
                  total: gallery.length,
                })}
                className="h-full w-full object-cover transition hover:opacity-90"
              />
            </button>
          ))}

          {gallery.length > 1 && (
            <Button
              variant="outline"
              className="absolute bottom-3 right-3 min-h-11 bg-surface/90 backdrop-blur"
              onClick={() => setLightboxOpen(true)}
            >
              <ImageIcon className="size-4" /> {t('gallery.viewAll', { count: gallery.length })}
            </Button>
          )}
        </div>

        <GalleryLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={gallery}
          index={activeImage}
          onIndexChange={setActiveImage}
          hotelName={hotel?.name ?? ''}
        />

        {/* Thanh điều hướng neo — sticky, scroll spy (SS-201) */}
        <AnchorNav sections={sections} />

        {/* Header */}
        <div id="overview" className="mt-6 scroll-mt-[var(--app-anchor-offset,7rem)]">
          <h1 className="font-be-vietnam text-3xl font-bold text-on-surface">
            {hotel?.name ?? 'Hotel'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
            {/* Điểm đánh giá tổng của khách — click cuộn tới mục Đánh giá (SS-201) */}
            {avgRating != null ? (
              <button
                type="button"
                onClick={() =>
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })
                }
                // Chip vàng ĐẶC + chữ tối: `text-premium-gold` trên nền nhạt chỉ đạt contrast
                // 2.0:1 nên số điểm sẽ mờ — đúng chỗ cần khách đọc được ngay.
                className="flex items-center gap-1.5 rounded-full bg-premium-gold px-3 py-1 font-bold text-on-surface transition-colors hover:bg-[color-mix(in_oklch,var(--color-premium-gold),black_12%)]"
              >
                <Star className="size-3.5 fill-current" aria-hidden="true" />
                <span>{avgRating.toFixed(1)}</span>
                <span className="font-normal text-on-surface-variant">
                  ({t('reviews.count', { count: reviewCount })})
                </span>
              </button>
            ) : (
              <span className="text-on-surface-variant">{t('noRatingYet')}</span>
            )}
            {/* Sao = HẠNG khách sạn (khác điểm đánh giá của khách ở mục Reviews) */}
            {hotel?.starRating ? (
              <span
                className="flex items-center gap-1.5"
                aria-label={t('starAria', { count: hotel.starRating })}
              >
                <StarRating value={hotel.starRating} size={16} />
                <span>{t('starHotel', { count: hotel.starRating })}</span>
              </span>
            ) : null}
            {hotel && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                {formatAddress(hotel.address, hotel.district, hotel.city, hotel.country)}
              </span>
            )}
            {hotel?.checkInTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" />{' '}
                {t('checkInTime', { time: hotel.checkInTime })}
                {hotel.checkOutTime ? t('checkOutTime', { time: hotel.checkOutTime }) : ''}
              </span>
            )}
          </div>

          {/* Dải niềm tin */}
          <ul className="mt-3 flex flex-wrap gap-2">
            {[
              { icon: BadgeCheck, label: t('trust.verified') },
              { icon: ShieldCheck, label: t('trust.securePayment') },
              { icon: Ticket, label: t('trust.instantVoucher') },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700"
              >
                <Icon className="size-3.5" aria-hidden="true" /> {label}
              </li>
            ))}
          </ul>

          {hotel?.description && (
            <p className="mt-4 max-w-3xl text-on-surface-variant">{hotel.description}</p>
          )}
        </div>

        {/* Hỗ trợ ra quyết định: tiện nghi → chính sách → vị trí, trước khi khách chọn phòng */}
        {hotel?.amenities && (
          <div id="amenities" className="scroll-mt-[var(--app-anchor-offset,7rem)]">
            <HotelAmenities amenities={hotel.amenities.map(a => a.amenity)} />
          </div>
        )}
        {hotel && <HotelPolicies hotel={hotel} />}

        {/* Map — toạ độ từ DB, hoặc geocode từ địa chỉ khi DB chưa có lat/lng */}
        {hasLocation ? (
          <section id="location" className="mt-6 scroll-mt-[var(--app-anchor-offset,7rem)]">
            <h2 className="mb-3 font-be-vietnam text-2xl font-bold text-on-surface">
              {t('location')}
            </h2>
            {mapLat != null && mapLng != null && (
              <HotelMap
                latitude={mapLat}
                longitude={mapLng}
                label={hotel?.name}
                className="h-72 w-full overflow-hidden rounded-2xl border border-outline-variant/30"
              />
            )}
            {hotel?.nearbyPlaces && <HotelNearby places={hotel.nearbyPlaces} />}
          </section>
        ) : null}

        {/* Stay picker */}
        <div
          id="stay-picker"
          // Viền + nền vàng nhạt: đây là bước ĐẦU TIÊN của luồng đặt phòng (không chọn ngày thì
          // không có giá lẫn phòng trống), nên phải hút mắt hơn các khối thông tin xung quanh.
          className="mt-8 flex scroll-mt-[var(--app-anchor-offset,7rem)] flex-col gap-4 rounded-2xl border border-premium-gold/45 bg-premium-gold/5 p-5 md:flex-row md:items-end"
        >
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={range => update({ checkIn: range.checkIn, checkOut: range.checkOut })}
            className="flex-1"
          />
          <GuestSelector value={guests} onChange={v => update({ guests: String(v) })} className="md:w-40" />
        </div>
        {!checkIn || !checkOut ? (
          <p className="mt-2 text-xs text-on-surface-variant">
            {t('selectDates')}
          </p>
        ) : null}

        {/* Room types */}
        <div id="rooms" className="mt-10 flex scroll-mt-[var(--app-anchor-offset,7rem)] flex-wrap items-center justify-between gap-3">
          <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
            {t('availableRooms')}
          </h2>
          {(roomTypes?.length ?? 0) >= 2 && (
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setCompareOpen(v => !v)}
              aria-expanded={compareOpen}
            >
              <Columns3 className="size-4" />
              {compareOpen ? t('compare.hide') : t('compare.toggle')}
            </Button>
          )}
        </div>

        {compareOpen && roomTypes && (
          <div className="mt-4">
            <RoomCompareTable roomTypes={roomTypes} onSelect={handleSelectRoom} />
          </div>
        )}
        <div className="mt-5 space-y-4">
          {roomsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)
          ) : !roomTypes || roomTypes.length === 0 ? (
            <EmptyState
              title={t('noRoomsTitle')}
              description={t('noRoomsDesc')}
            />
          ) : (
            roomTypes.map(rt => (
              <RoomTypeCard
                key={rt.id}
                roomType={rt}
                selectable
                onSelect={handleSelectRoom}
                bestValue={roomTypes.length > 1 && rt.id === bestValueRoomId}
                detailHref={`${ROUTES.roomTypeDetail(rt.hotelId, rt.id)}?${roomQuery}`}
                freeUntilHours={getFreeCancellationHours(hotel?.settings)}
              />
            ))
          )}
        </div>

        {(!checkIn || !checkOut) && roomTypes && roomTypes.length > 0 && (
          <div className="mt-6">
            <Button
              size="lg"
              variant="cta"
              onClick={() => document.getElementById('stay-picker')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('pickDates')}
            </Button>
          </div>
        )}

        {/* Bằng chứng xã hội — chốt lại sau khi khách đã xem phòng */}
        <div id="reviews" className="scroll-mt-[var(--app-anchor-offset,7rem)]">
          <HotelReviews hotelId={hotelId} />
        </div>
      </div>

      {/* Mobile: giá + CTA luôn trong tầm ngón tay */}
      <StickyBookingBar
        minPrice={fromPrice}
        onSelectRoom={() =>
          document.getElementById('stay-picker')?.scrollIntoView({ behavior: 'smooth' })
        }
      />
    </div>
  );
}
