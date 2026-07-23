import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DateRangePicker from '@/components/shared/DateRangePicker';
import DestinationAutocomplete from './DestinationAutocomplete';
import GuestsPopover, { type GuestSelection } from './GuestsPopover';

/**
 * Thanh tìm kiếm hero (SS-001) — tách khỏi Hero.tsx. Gồm 3 phần: autocomplete điểm đến,
 * chọn khoảng ngày (tái dùng DateRangePicker shared), bộ chọn khách (Người lớn/Trẻ em/Phòng).
 * Submit điều hướng `/search` mang đủ params: city, checkIn, checkOut, adults, children, rooms
 * + `guests` (= adults + children) để endpoint search hiện tại vẫn dùng được ngay.
 */
export default function HeroSearchBar() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');

  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState<GuestSelection>({
    adults: 2,
    children: 0,
    rooms: 1,
  });

  const submit = () => {
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    // checkIn/checkOut phải đi cùng nhau thì BE mới tính tồn kho + giá kỳ ở.
    if (checkIn && checkOut) {
      params.set('checkIn', checkIn);
      params.set('checkOut', checkOut);
    }
    params.set('adults', String(guests.adults));
    params.set('children', String(guests.children));
    params.set('rooms', String(guests.rooms));
    // Endpoint search hiện chỉ nhận `guests` — giữ để hoạt động ngay (SS-101 sẽ nhận adults/... sau).
    params.set('guests', String(guests.adults + guests.children));
    navigate(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-3 rounded-3xl border border-outline-variant/20 bg-white p-3 shadow-2xl md:flex-row md:items-end md:gap-2 md:rounded-[2rem] md:p-3"
    >
      {/* Điểm đến */}
      <div className="flex flex-1 flex-col px-4 py-2 md:flex-[1.4]">
        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {t('hero.destination')}
        </label>
        <DestinationAutocomplete
          value={city}
          onChange={setCity}
          placeholder={t('hero.destinationPlaceholder')}
        />
      </div>

      <div className="hidden w-px self-stretch bg-outline-variant/30 md:block" />

      {/* Ngày nhận/trả */}
      <div className="flex-1 px-4 py-1 md:flex-[1.8]">
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={range => {
            setCheckIn(range.checkIn);
            setCheckOut(range.checkOut);
          }}
        />
      </div>

      <div className="hidden w-px self-stretch bg-outline-variant/30 md:block" />

      {/* Khách */}
      <div className="flex flex-1 flex-col px-4 py-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <Users className="size-3" /> {t('hero.guests')}
        </span>
        <GuestsPopover value={guests} onChange={setGuests} className="mt-1.5" />
      </div>

      <Button
        type="submit"
        aria-label={t('hero.searchButton')}
        className="h-14 w-full gap-2 rounded-2xl border-none bg-on-surface text-white shadow-lg transition-all hover:bg-primary md:w-auto md:px-7"
      >
        <Search className="size-5" />
        <span className="md:hidden lg:inline">{t('hero.searchButton')}</span>
      </Button>
    </form>
  );
}
