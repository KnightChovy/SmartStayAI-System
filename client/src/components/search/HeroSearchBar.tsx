import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { toDateInputValue } from '@/utils/formatDate';
import { applyCheckIn, maxCheckOut, minCheckOut } from '@/utils/stayDates';
import DestinationAutocomplete from './DestinationAutocomplete';
import DateSegment from './DateSegment';
import GuestsPopover, { type GuestSelection } from './GuestsPopover';
import { SearchSegment } from './SearchSegment';
import { SEGMENT_DIVIDER_CLASS } from './segment-styles';

/**
 * Thanh tìm kiếm hero (SS-001). Bốn ô dùng CHUNG khung `SearchSegment` (nhãn viết hoa nhỏ +
 * giá trị), phân cách bằng gạch mảnh, cả thanh chỉ có MỘT lớp viền — không còn ô có viền lồng
 * trong thanh có viền như bản mượn `DateRangePicker` của form.
 *
 * Submit điều hướng `/search` mang đủ params: city, checkIn, checkOut, adults, children,
 * rooms + `guests` (= adults + children) để endpoint search hiện tại vẫn dùng được ngay.
 */
export default function HeroSearchBar() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  const destinationId = useId();

  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState<GuestSelection>({
    adults: 2,
    children: 0,
    rooms: 1,
  });

  const today = toDateInputValue(new Date());

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
      className="flex flex-col rounded-[28px] border border-outline-variant/20 bg-white p-2 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)] md:flex-row md:items-stretch md:rounded-full md:p-1.5 md:pl-2"
    >
      <SearchSegment
        label={t('hero.destination')}
        icon={MapPin}
        htmlFor={destinationId}
        className="md:flex-[1.5]"
      >
        <DestinationAutocomplete
          id={destinationId}
          value={city}
          onChange={setCity}
          placeholder={t('hero.destinationPlaceholder')}
          // Cùng cỡ chữ với giá trị của các ô còn lại (`segmentValueClass`).
          inputClassName="mt-0 text-[15px] font-semibold placeholder:text-outline/60"
        />
      </SearchSegment>

      <DateSegment
        label={t('hero.checkIn')}
        value={checkIn}
        onChange={value => {
          // Ngày trả luôn phải sau ngày nhận — chốt ngay thay vì để khách bấm Tìm rồi báo lỗi.
          const range = applyCheckIn(value, checkOut);
          setCheckIn(range.checkIn);
          setCheckOut(range.checkOut);
        }}
        min={today}
        placeholder={t('hero.addDate')}
        className={cn('md:flex-1', SEGMENT_DIVIDER_CLASS)}
      />

      <DateSegment
        label={t('hero.checkOut')}
        value={checkOut}
        onChange={setCheckOut}
        min={minCheckOut(checkIn, today)}
        max={maxCheckOut(checkIn)}
        placeholder={t('hero.addDate')}
        className={cn('md:flex-1', SEGMENT_DIVIDER_CLASS)}
      />

      <GuestsPopover
        value={guests}
        onChange={setGuests}
        className={cn('md:flex-[1.2]', SEGMENT_DIVIDER_CLASS)}
      />

      <div className="mt-2 flex md:mt-0 md:items-center md:pl-2">
        <Button
          type="submit"
          variant="cta"
          className="h-12 w-full gap-2 rounded-2xl text-[15px] md:w-auto md:rounded-full md:px-7"
        >
          <Search className="size-4.5" aria-hidden="true" />
          {t('hero.searchButton')}
        </Button>
      </div>
    </form>
  );
}
