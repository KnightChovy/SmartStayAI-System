import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Columns3,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { useHotel } from '@/hooks/hotels/use-hotel';
import { useRoomTypes } from '@/hooks/hotels/use-room-types';
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
import type { HotelSearchResult, RoomType } from '@/types/hotel.types';

const FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop';

export default function HotelDetailPage() {
  const { t } = useTranslation('hotel');
  const { hotelId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Hotel summary có thể đã được truyền qua router state từ trang search
  const stateHotel = (location.state as { hotel?: HotelSearchResult } | null)?.hotel ?? null;
  const { data: hotel, isLoading: hotelLoading } = useHotel(hotelId, stateHotel);

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
    // pb lớn trên mobile để thanh sticky không che nội dung cuối trang
    <div className="w-full py-8 pb-28 lg:pb-8">
      <div className="mx-auto max-w-7xl px-margin-mobile md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2 flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft className="size-4" /> {t('backToResults')}
        </button>

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

        {/* Header */}
        <div className="mt-6">
          <h1 className="font-be-vietnam text-3xl font-bold text-on-surface">
            {hotel?.name ?? 'Hotel'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
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

        {/* Map — toạ độ từ DB, hoặc geocode từ địa chỉ khi DB chưa có lat/lng */}
        {(mapLat != null && mapLng != null) || (hotel?.nearbyPlaces?.length ?? 0) > 0 ? (
          <section className="mt-6">
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
          className="mt-8 flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5 md:flex-row md:items-end"
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
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
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
              />
            ))
          )}
        </div>

        {(!checkIn || !checkOut) && roomTypes && roomTypes.length > 0 && (
          <div className="mt-6">
            <Button
              size="lg"
              className="bg-on-surface text-white hover:bg-primary"
              onClick={() => document.getElementById('stay-picker')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('pickDates')}
            </Button>
          </div>
        )}

        {/* Hỗ trợ ra quyết định: tiện nghi → chính sách → bằng chứng xã hội */}
        {hotel?.amenities && (
          <HotelAmenities amenities={hotel.amenities.map(a => a.amenity)} />
        )}
        {hotel && <HotelPolicies hotel={hotel} />}
        <HotelReviews hotelId={hotelId} />
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
