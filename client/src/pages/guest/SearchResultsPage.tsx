import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchHotels } from '@/hooks/hotels/use-search-hotels';
import { useAmenities } from '@/hooks/hotel-management';
import HotelCard from '@/components/shared/HotelCard';
import EmptyState from '@/components/shared/EmptyState';
import Paginator from '@/components/shared/Paginator';
import DateRangePicker from '@/components/shared/DateRangePicker';
import GuestCounters from '@/components/search/GuestCounters';
import type { GuestSelection } from '@/components/search/GuestsPopover';
import SortDropdown from '@/components/search/SortDropdown';
import PriceRangeSlider from '@/components/search/filters/PriceRangeSlider';
import StarRatingFilter from '@/components/search/filters/StarRatingFilter';
import AmenitiesFilter from '@/components/search/filters/AmenitiesFilter';
import ReviewScoreFilter from '@/components/search/filters/ReviewScoreFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { HotelSearchParams, HotelSortBy } from '@/types/hotel.types';

const SORT_VALUES: HotelSortBy[] = [
  'recommended',
  'price:asc',
  'price:desc',
  'rating:desc',
];

/** Dải giá cố định cho slider (0 – 100 triệu VNĐ) — không phụ thuộc kết quả hiện tại. */
const PRICE_MIN = 0;
const PRICE_MAX = 100_000_000;

/** Trang kết quả tìm kiếm khách sạn — đọc/ghi toàn bộ bộ lọc trên URL query string. */
export default function SearchResultsPage() {
  const { t } = useTranslation(['search', 'common']);
  const [params, setParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const rawSort = params.get('sortBy');
  const sortBy: HotelSortBy = SORT_VALUES.includes(rawSort as HotelSortBy)
    ? (rawSort as HotelSortBy)
    : 'rating:desc';
  const starsArr = (params.get('stars') ?? '')
    .split(',')
    .map(Number)
    .filter(n => n >= 1 && n <= 5);
  const amenArr = (params.get('amenities') ?? '').split(',').filter(Boolean);
  const priceMin = params.get('priceMin')
    ? Number(params.get('priceMin'))
    : undefined;
  const priceMax = params.get('priceMax')
    ? Number(params.get('priceMax'))
    : undefined;
  const reviewScore = params.get('reviewScore')
    ? Number(params.get('reviewScore'))
    : undefined;

  // Khách: tách Người lớn / Trẻ em / Số phòng (khớp thanh tìm kiếm hero). Không có `adults`
  // (link cũ chỉ mang `guests`) thì suy `adults = guests`, `children = 0`.
  const guestSel: GuestSelection = {
    adults: params.get('adults')
      ? Number(params.get('adults'))
      : params.get('guests')
        ? Number(params.get('guests'))
        : 2,
    children: params.get('children') ? Number(params.get('children')) : 0,
    rooms: params.get('rooms') ? Number(params.get('rooms')) : 1,
  };

  const filters: HotelSearchParams = useMemo(
    () => ({
      city: params.get('city') ?? undefined,
      checkIn: params.get('checkIn') ?? undefined,
      checkOut: params.get('checkOut') ?? undefined,
      guests: params.get('guests') ? Number(params.get('guests')) : undefined,
      sortBy,
      page: params.get('page') ? Number(params.get('page')) : 1,
      priceMin,
      priceMax,
      stars: params.get('stars') ?? undefined,
      amenities: params.get('amenities') ?? undefined,
      reviewScore,
    }),
    [params, sortBy, priceMin, priceMax, reviewScore]
  );

  const { data, isLoading, isError } = useSearchHotels(filters);
  const { data: amenityList } = useAmenities('hotel');

  // Ô điểm đến là input có kiểm soát để nút Search submit được; đồng bộ khi `city` trên URL đổi.
  const [cityInput, setCityInput] = useState(filters.city ?? '');
  const [syncedCity, setSyncedCity] = useState(filters.city);
  if (filters.city !== syncedCity) {
    setSyncedCity(filters.city);
    setCityInput(filters.city ?? '');
  }

  /** Cập nhật một (hoặc nhiều) tham số lọc trên URL, reset page khi đổi filter. */
  const update = (
    patch: Record<string, string | undefined>,
    resetPage = true
  ) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete('page');
    setParams(next);
  };

  const detailQuery = useMemo(() => {
    const q = new URLSearchParams();
    if (filters.checkIn) q.set('checkIn', filters.checkIn);
    if (filters.checkOut) q.set('checkOut', filters.checkOut);
    // Mang TÁCH người lớn/trẻ em sang trang chi tiết — gửi số gộp thì bộ chọn bên đó không
    // dựng lại được lựa chọn của khách (trẻ em sẽ bị đếm thành người lớn).
    q.set('adults', String(guestSel.adults));
    q.set('children', String(guestSel.children));
    const s = q.toString();
    return s ? `?${s}` : '';
  }, [filters.checkIn, filters.checkOut, guestSel.adults, guestSel.children]);

  const results = data?.results ?? [];

  const activeCount =
    starsArr.length +
    amenArr.length +
    (priceMin != null || priceMax != null ? 1 : 0) +
    (reviewScore != null ? 1 : 0);

  const clearAll = () =>
    update({
      priceMin: undefined,
      priceMax: undefined,
      stars: undefined,
      amenities: undefined,
      reviewScore: undefined,
    });

  const updateStars = (nums: number[]) =>
    update({ stars: nums.length ? [...nums].sort().join(',') : undefined });
  const updateAmenities = (ids: string[]) =>
    update({ amenities: ids.length ? ids.join(',') : undefined });
  const updateReviewScore = (score?: number) =>
    update({ reviewScore: score != null ? String(score) : undefined });
  const updateGuests = (sel: GuestSelection) =>
    update({
      adults: String(sel.adults),
      children: String(sel.children),
      rooms: String(sel.rooms),
      // Endpoint search chỉ nhận `guests` → giữ đồng bộ = người lớn + trẻ em.
      guests: String(sel.adults + sel.children),
    });
  const updatePrice = ([lo, hi]: [number, number]) => {
    // Cả dải = không lọc giá.
    if (lo <= PRICE_MIN && hi >= PRICE_MAX) {
      update({ priceMin: undefined, priceMax: undefined });
    } else {
      update({ priceMin: String(lo), priceMax: String(hi) });
    }
  };

  // Nội dung sidebar dùng chung cho desktop (aside) và mobile (bottom-sheet).
  // Cả khối là một form: Enter trong ô điểm đến hoặc bấm nút Search (ở CUỐI) đều áp dụng city
  // + đóng bottom-sheet trên mobile. Các bộ lọc khác cập nhật ngay (realtime).
  const sidebar = (
    <form
      onSubmit={e => {
        e.preventDefault();
        update({ city: cityInput.trim() || undefined });
        setSheetOpen(false);
      }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-bold text-on-surface">
          <SlidersHorizontal className="size-4 text-primary" /> {t('filters')}
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 text-xs font-bold text-primary">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
          {t('destination')}
        </span>
        <div className="flex h-10 items-center gap-2 rounded-lg border border-outline-variant/40 px-3">
          <Search className="size-4 shrink-0 text-on-surface-variant" />
          <input
            value={cityInput}
            onChange={e => setCityInput(e.target.value)}
            placeholder={t('cityPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none"
          />
        </div>
      </label>

      <DateRangePicker
        checkIn={filters.checkIn ?? ''}
        checkOut={filters.checkOut ?? ''}
        onChange={range =>
          update({ checkIn: range.checkIn, checkOut: range.checkOut })
        }
      />

      <GuestCounters value={guestSel} onChange={updateGuests} />

      <SortDropdown
        value={sortBy}
        onChange={value => update({ sortBy: value })}
      />

      <div className="space-y-4 border-t border-outline-variant/30 pt-4">
        <PriceRangeSlider
          bounds={{ min: PRICE_MIN, max: PRICE_MAX }}
          value={[priceMin ?? PRICE_MIN, priceMax ?? PRICE_MAX]}
          onCommit={updatePrice}
        />
        <StarRatingFilter value={starsArr} onChange={updateStars} />
        {amenityList && amenityList.length > 0 && (
          <AmenitiesFilter
            amenities={amenityList}
            value={amenArr}
            onChange={updateAmenities}
          />
        )}
        <ReviewScoreFilter value={reviewScore} onChange={updateReviewScore} />
      </div>

      {/* Nút Search ở CUỐI filter (áp dụng điểm đến + đóng sheet trên mobile) */}
      <Button type="submit" variant="cta" className="min-h-11 w-full">
        <Search className="size-4" />
        {t('common:search')}
      </Button>
    </form>
  );

  return (
    <div className="w-full py-10">
      <div className="mx-auto max-w-7xl px-margin-mobile md:px-8">
        <h1 className="font-be-vietnam text-3xl font-bold text-on-surface">
          {filters.city
            ? t('titleCity', { city: filters.city })
            : t('titleDefault')}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {data
            ? t('resultsFound', { count: data.totalResults })
            : t('searching')}
        </p>

        {/* Mobile: nút mở bộ lọc dạng bottom-sheet (SS-704) */}
        <div className="mt-4 lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="min-h-11 w-full">
                <SlidersHorizontal className="size-4" />
                {t('openFilters')}
                {activeCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-on-primary">
                    {activeCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[85vh] overflow-auto rounded-t-2xl p-4"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>{t('filters')}</SheetTitle>
              </SheetHeader>
              {sidebar}
            </SheetContent>
          </Sheet>
        </div>

        <div className="mt-6 flex flex-col gap-8 lg:mt-8 lg:flex-row">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:w-80 lg:shrink-0">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 lg:sticky lg:top-24">
              {sidebar}
            </div>
          </aside>

          {/* Results */}
          <section className="min-w-0 flex-1">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                title={t('errorTitle')}
                description={t('errorDesc')}
              />
            ) : results.length === 0 ? (
              <EmptyState
                icon={Search}
                title={t('emptyTitle')}
                description={t('emptyDesc')}
              />
            ) : (
              <div className="space-y-4">
                {results.map(hotel => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    searchQuery={detailQuery}
                  />
                ))}
              </div>
            )}

            {data && (
              <Paginator
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={p => {
                  update({ page: p > 1 ? String(p) : undefined }, false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                hrefForPage={p => {
                  const next = new URLSearchParams(params);
                  if (p > 1) next.set('page', String(p));
                  else next.delete('page');
                  const s = next.toString();
                  return s ? `?${s}` : '?';
                }}
                className="mt-8"
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
