import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useHotel } from '@/hooks/hotels/use-hotel';
import { useRoomTypes } from '@/hooks/hotels/use-room-types';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import StarRating from '@/components/shared/StarRating';
import RoomTypeCard from '@/components/shared/RoomTypeCard';
import HotelMap from '@/components/shared/HotelMap';
import EmptyState from '@/components/shared/EmptyState';
import DateRangePicker from '@/components/shared/DateRangePicker';
import GuestSelector from '@/components/shared/GuestSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toDateInputValue } from '@/utils/formatDate';
import type { HotelSearchResult, RoomType } from '@/types/hotel.types';

const FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop';

export default function HotelDetailPage() {
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

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  // Gallery: ảnh khách sạn + ảnh đại diện từng loại phòng
  const [activeImage, setActiveImage] = useState(0);
  const gallery = useMemo(() => {
    const imgs = [
      ...(hotel?.images?.map(i => i.url) ?? []),
      ...(roomTypes?.flatMap(rt => rt.images?.map(i => i.url) ?? []) ?? []),
    ];
    return imgs.length ? [...new Set(imgs)] : [FALLBACK];
  }, [hotel, roomTypes]);

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
    <div className="w-full py-8">
      <div className="mx-auto max-w-7xl px-margin-mobile md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Back to results
        </button>

        {/* Gallery */}
        <div className="grid gap-3 md:grid-cols-4 md:grid-rows-2">
          <div className="overflow-hidden rounded-3xl md:col-span-2 md:row-span-2">
            <img src={gallery[activeImage]} alt={hotel?.name ?? 'Hotel'} className="h-72 w-full object-cover md:h-full" />
          </div>
          {gallery.slice(0, 4).map((url, i) => (
            <button
              key={url + i}
              onClick={() => setActiveImage(gallery.indexOf(url))}
              className="hidden overflow-hidden rounded-2xl md:block"
            >
              <img src={url} alt="" className="h-full w-full object-cover transition hover:opacity-90" />
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="mt-6">
          <h1 className="font-be-vietnam text-3xl font-bold text-on-surface">
            {hotel?.name ?? 'Hotel'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
            {hotel?.starRating ? <StarRating value={hotel.starRating} size={16} /> : null}
            {hotel && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {[hotel.address, hotel.district, hotel.city, hotel.country].filter(Boolean).join(', ')}
              </span>
            )}
            {hotel?.checkInTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> Check-in {hotel.checkInTime}
                {hotel.checkOutTime ? ` · Check-out ${hotel.checkOutTime}` : ''}
              </span>
            )}
          </div>
          {hotel?.description && (
            <p className="mt-4 max-w-3xl text-on-surface-variant">{hotel.description}</p>
          )}
        </div>

        {/* Map — chỉ hiện khi khách sạn có toạ độ thật trong DB */}
        {hotel?.latitude && hotel?.longitude && (
          <div className="mt-6">
            <h2 className="mb-3 font-be-vietnam text-xl font-bold text-on-surface">Location</h2>
            <HotelMap
              latitude={Number(hotel.latitude)}
              longitude={Number(hotel.longitude)}
              label={hotel.name}
              className="h-72 w-full overflow-hidden rounded-2xl border border-outline-variant/30"
            />
          </div>
        )}

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
            Select your dates to see availability and total price.
          </p>
        ) : null}

        {/* Room types */}
        <h2 className="mt-10 font-be-vietnam text-2xl font-bold text-on-surface">Available rooms</h2>
        <div className="mt-5 space-y-4">
          {roomsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)
          ) : !roomTypes || roomTypes.length === 0 ? (
            <EmptyState
              title="No rooms available"
              description="There are no rooms matching your dates or guest count. Try different dates."
            />
          ) : (
            roomTypes.map(rt => (
              <RoomTypeCard key={rt.id} roomType={rt} selectable onSelect={handleSelectRoom} />
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
              Pick dates to book
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
