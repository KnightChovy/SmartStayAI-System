import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchHotels } from '@/hooks/hotels/use-search-hotels';
import HotelCard from '@/components/shared/HotelCard';
import EmptyState from '@/components/shared/EmptyState';
import DateRangePicker from '@/components/shared/DateRangePicker';
import GuestSelector from '@/components/shared/GuestSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { HotelSearchParams } from '@/types/hotel.types';

/** Trang kết quả tìm kiếm khách sạn — đọc/ghi bộ lọc trên URL query string. */
export default function SearchResultsPage() {
  const { t } = useTranslation(['search', 'common']);
  const [params, setParams] = useSearchParams();

  const filters: HotelSearchParams = useMemo(
    () => ({
      city: params.get('city') ?? undefined,
      checkIn: params.get('checkIn') ?? undefined,
      checkOut: params.get('checkOut') ?? undefined,
      guests: params.get('guests') ? Number(params.get('guests')) : undefined,
      sortBy: params.get('sortBy') ?? undefined,
      page: params.get('page') ? Number(params.get('page')) : 1,
    }),
    [params]
  );

  const { data, isLoading, isError } = useSearchHotels(filters);

  /** Cập nhật một (hoặc nhiều) tham số lọc trên URL, reset page khi đổi filter. */
  const update = (patch: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete('page');
    setParams(next);
  };

  // Query string mang theo khi mở trang chi tiết (giữ ngày/khách đã chọn)
  const detailQuery = useMemo(() => {
    const q = new URLSearchParams();
    if (filters.checkIn) q.set('checkIn', filters.checkIn);
    if (filters.checkOut) q.set('checkOut', filters.checkOut);
    if (filters.guests) q.set('guests', String(filters.guests));
    const s = q.toString();
    return s ? `?${s}` : '';
  }, [filters.checkIn, filters.checkOut, filters.guests]);

  const results = data?.results ?? [];

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

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Filter bar */}
          <aside className="lg:w-72 lg:shrink-0">
            <div className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface p-5 lg:sticky lg:top-24">
              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <SlidersHorizontal className="size-4 text-primary" /> {t('filters')}
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-on-surface-variant">{t('destination')}</span>
                <div className="flex items-center gap-2 rounded-xl border border-outline-variant/40 px-3">
                  <Search className="size-4 text-on-surface-variant" />
                  <input
                    defaultValue={filters.city ?? ''}
                    onBlur={e => update({ city: e.target.value || undefined })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') update({ city: (e.target as HTMLInputElement).value || undefined });
                    }}
                    placeholder={t('cityPlaceholder')}
                    className="h-11 flex-1 bg-transparent text-sm text-on-surface outline-none"
                  />
                </div>
              </label>

              <DateRangePicker
                className="grid-cols-1"
                checkIn={filters.checkIn ?? ''}
                checkOut={filters.checkOut ?? ''}
                onChange={range => update({ checkIn: range.checkIn, checkOut: range.checkOut })}
              />

              <GuestSelector
                value={filters.guests ?? 2}
                onChange={value => update({ guests: String(value) })}
              />

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-on-surface-variant">{t('sortBy')}</span>
                <select
                  value={filters.sortBy ?? ''}
                  onChange={e => update({ sortBy: e.target.value || undefined })}
                  className="h-11 rounded-xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary"
                >
                  <option value="">{t('sortRecommended')}</option>
                  <option value="starRating:desc">{t('sortStar')}</option>
                  <option value="createdAt:desc">{t('sortNewest')}</option>
                </select>
              </label>
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
                  <HotelCard key={hotel.id} hotel={hotel} searchQuery={detailQuery} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => update({ page: String((filters.page ?? 1) - 1) }, false)}
                >
                  {t('common:previous')}
                </Button>
                <span className="px-3 text-sm text-on-surface-variant">
                  {t('pageOf', { page: data.page, total: data.totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={(filters.page ?? 1) >= data.totalPages}
                  onClick={() => update({ page: String((filters.page ?? 1) + 1) }, false)}
                >
                  {t('common:next')}
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
