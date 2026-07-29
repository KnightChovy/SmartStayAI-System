import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { usePublicHotelReviews, usePublicReviewStats } from '@/hooks/hotel-reviews';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateShort } from '@/utils/formatDate';
import { REVIEW_SCORE_MAX, scoreLabelKey } from '@/utils/reviewScore';
import type { ReviewScoreBucket } from '@/types/hotel-review.types';

/** Số review hiển thị ban đầu; mỗi lần "Xem thêm" tăng thêm bấy nhiêu. */
const PAGE_SIZE = 5;

const SUBSCORES = [
  { key: 'cleanliness', labelKey: 'reviews.cleanliness' },
  { key: 'service', labelKey: 'reviews.service' },
  { key: 'location', labelKey: 'reviews.locationScore' },
  { key: 'value', labelKey: 'reviews.value' },
] as const;

/** Các mức điểm 10 → 1 cho biểu đồ phân bố. */
const BUCKETS: ReviewScoreBucket[] = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];

interface HotelReviewsProps {
  hotelId: string;
}

/**
 * Bằng chứng xã hội trên trang chi tiết (SS-202): điểm tổng + số lượng + điểm thành phần +
 * PHÂN BỐ ĐIỂM + danh sách review có "Xem thêm". Điểm/phân bố lấy từ `GET /hotels/:id/review-stats`
 * (tính trên TẤT CẢ review published, không phải mẫu); danh sách phân trang qua `GET /reviews`.
 * ⚠️ Điểm đánh giá dùng thang {@link REVIEW_SCORE_MAX} (10) — khác hạng sao KS (1–5).
 */
export default function HotelReviews({ hotelId }: HotelReviewsProps) {
  const { t } = useTranslation('hotel');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: stats, isLoading: statsLoading } = usePublicReviewStats(hotelId);
  const { data: listData, isFetching } = usePublicHotelReviews(hotelId, {
    limit,
    sortBy: 'createdAt:desc',
  });

  const reviews = listData?.results ?? [];
  const total = stats?.total ?? 0;
  const overall = stats?.average.overall ?? null;

  if (statsLoading) {
    return (
      <section className="mt-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
      </section>
    );
  }

  // Chưa có review → nói thật, không bịa điểm.
  if (total === 0) {
    return (
      <section className="mt-10">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">{t('reviews.title')}</h2>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface p-5">
          <Sparkles className="size-5 shrink-0 text-premium-gold" aria-hidden="true" />
          <div>
            <p className="font-semibold text-on-surface">{t('reviews.newTitle')}</p>
            <p className="text-sm text-on-surface-variant">{t('reviews.newDesc')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">{t('reviews.title')}</h2>

      <div className="mt-4 rounded-2xl border border-outline-variant/30 bg-surface p-5">
        {/* Điểm tổng + điểm thành phần (thang 10) */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex items-center gap-3 md:w-56 md:shrink-0">
            {/* Ô điểm tô vàng ĐẶC — thứ thuyết phục khách đặt phòng nhất trong cả trang.
                Chữ để màu tối (contrast 8.5:1); chữ trắng trên vàng chỉ được 2.0:1. */}
            <div
              className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-premium-gold font-bold text-on-surface shadow-sm"
              aria-hidden="true"
            >
              <span className="text-2xl leading-none">{overall?.toFixed(1) ?? '—'}</span>
              <span className="text-[10px] font-semibold opacity-70">/ {REVIEW_SCORE_MAX}</span>
            </div>
            <div>
              <p className="font-be-vietnam text-lg font-bold text-on-surface">
                {overall != null ? t(scoreLabelKey(overall)) : '—'}
              </p>
              <p className="text-sm text-on-surface-variant">{t('reviews.count', { count: total })}</p>
              <p className="sr-only">
                {t('reviews.aria', { score: overall?.toFixed(1) ?? '—', count: total })}
              </p>
            </div>
          </div>

          <dl className="grid flex-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {SUBSCORES.map(({ key, labelKey }) => {
              const value = stats?.average[key] ?? null;
              return (
                <div key={labelKey} className="flex items-center gap-3">
                  <dt className="w-24 shrink-0 text-sm text-on-surface-variant">{t(labelKey)}</dt>
                  <dd className="flex flex-1 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-low">
                      <div
                        className="h-full rounded-full bg-premium-gold"
                        style={{ width: `${((value ?? 0) / REVIEW_SCORE_MAX) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-semibold text-on-surface">
                      {value?.toFixed(1) ?? '—'}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        {/* Phân bố điểm 10 → 1 (SS-202) */}
        <div className="mt-6 space-y-1.5 border-t border-outline-variant/30 pt-5">
          {BUCKETS.map(bucket => {
            const count = stats?.countByStar[bucket] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={bucket} className="flex items-center gap-3 text-sm">
                <span
                  className="w-6 shrink-0 text-right font-medium text-on-surface-variant"
                  aria-label={t('reviews.breakdownScore', { count: Number(bucket) })}
                >
                  {bucket}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-low">
                  <div className="h-full rounded-full bg-premium-gold" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-on-surface-variant">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Danh sách review + Xem thêm */}
        <div className="mt-6 space-y-4 border-t border-outline-variant/30 pt-5">
          {reviews.map(r => (
            <article key={r.id} className="rounded-xl bg-surface-container-low/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-on-surface">
                  {r.customer?.fullName ?? t('reviews.guest')}
                </p>
                <div className="flex items-center gap-2">
                  {/* Điểm từng review theo thang 10 (không dùng 5 sao) */}
                  <span className="inline-flex items-center rounded-lg bg-premium-gold px-2 py-0.5 text-sm font-bold text-on-surface">
                    {r.overallRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-on-surface-variant">{formatDateShort(r.createdAt)}</span>
                </div>
              </div>
              {r.title && <p className="mt-1.5 font-medium text-on-surface">{r.title}</p>}
              <p className="mt-1 text-sm text-on-surface-variant">{r.content}</p>
              {r.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.images.slice(0, 4).map(img => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={t('reviews.photoAlt')}
                      loading="lazy"
                      className="size-16 rounded-lg border border-outline-variant/30 object-cover"
                    />
                  ))}
                </div>
              )}
            </article>
          ))}

          {reviews.length < total && (
            <Button
              variant="outline"
              className="min-h-11 w-full"
              disabled={isFetching}
              onClick={() => setLimit(l => l + PAGE_SIZE)}
            >
              {t('reviews.showMore')} ({reviews.length}/{total})
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
