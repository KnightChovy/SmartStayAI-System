import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareQuote, Sparkles, Star } from 'lucide-react';
import { usePublicHotelReviews } from '@/hooks/hotel-reviews';
import StarRating from '@/components/shared/StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateShort } from '@/utils/formatDate';
import type { HotelReview } from '@/types/hotel-review.types';

/** Số review kéo về để tính điểm trung bình + hiển thị (BE chưa có endpoint stats công khai). */
const SAMPLE_LIMIT = 100;
/** Số review hiển thị trong phần "recent". */
const RECENT_COUNT = 4;

/** Key i18n cho nhãn chữ của điểm 1–5, theo tinh thần Booking ("8.9 Excellent"). */
function scoreLabelKey(score: number) {
  if (score >= 4.5) return 'reviews.exceptional' as const;
  if (score >= 4) return 'reviews.excellent' as const;
  if (score >= 3.5) return 'reviews.veryGood' as const;
  if (score >= 3) return 'reviews.good' as const;
  return 'reviews.score' as const;
}

const SUBSCORES = [
  { key: 'cleanlinessRating', labelKey: 'reviews.cleanliness' },
  { key: 'serviceRating', labelKey: 'reviews.service' },
  { key: 'locationRating', labelKey: 'reviews.locationScore' },
  { key: 'valueRating', labelKey: 'reviews.value' },
] as const;

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

interface HotelReviewsProps {
  hotelId: string;
}

/**
 * Bằng chứng xã hội trên trang chi tiết: điểm tổng + số lượng + điểm thành phần + review gần đây.
 * Điểm tính client-side từ tối đa {@link SAMPLE_LIMIT} review mới nhất (BE chưa có stats công khai);
 * số lượng lấy từ `totalResults` nên luôn chính xác.
 */
export default function HotelReviews({ hotelId }: HotelReviewsProps) {
  const { t } = useTranslation('hotel');
  const { data, isLoading } = usePublicHotelReviews(hotelId, {
    limit: SAMPLE_LIMIT,
    sortBy: 'createdAt:desc',
  });

  const reviews: HotelReview[] = useMemo(() => data?.results ?? [], [data]);
  const total = data?.totalResults ?? 0;

  const overall = useMemo(() => avg(reviews.map(r => r.overallRating)), [reviews]);
  const subscores = useMemo(
    () =>
      SUBSCORES.map(({ key, labelKey }) => ({
        labelKey,
        value: avg(reviews.map(r => r[key])),
      })),
    [reviews]
  );

  if (isLoading) {
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
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
          {t('reviews.title')}
        </h2>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface p-5">
          <Sparkles className="size-5 shrink-0 text-primary" aria-hidden="true" />
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
        {/* Điểm tổng + điểm thành phần */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex items-center gap-3 md:w-56 md:shrink-0">
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-on-primary"
              aria-hidden="true"
            >
              {overall?.toFixed(1)}
            </div>
            <div>
              <p className="font-be-vietnam font-bold text-on-surface">
                {overall != null ? t(scoreLabelKey(overall)) : '—'}
              </p>
              <p className="text-sm text-on-surface-variant">
                {t('reviews.count', { count: total })}
              </p>
              <p className="sr-only">
                {t('reviews.aria', { score: overall?.toFixed(1) ?? '—', count: total })}
              </p>
            </div>
          </div>

          <dl className="grid flex-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {subscores.map(({ labelKey, value }) => (
              <div key={labelKey} className="flex items-center gap-3">
                <dt className="w-24 shrink-0 text-sm text-on-surface-variant">{t(labelKey)}</dt>
                <dd className="flex flex-1 items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-low">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${((value ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold text-on-surface">
                    {value?.toFixed(1) ?? '—'}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Review gần đây */}
        <div className="mt-6 space-y-4 border-t border-outline-variant/30 pt-5">
          {reviews.slice(0, RECENT_COUNT).map(r => (
            <article key={r.id} className="rounded-xl bg-surface-container-low/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-on-surface">
                  {r.customer?.fullName ?? t('reviews.guest')}
                </p>
                <div className="flex items-center gap-2">
                  <StarRating value={r.overallRating} size={14} />
                  <span className="text-xs text-on-surface-variant">
                    {formatDateShort(r.createdAt)}
                  </span>
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

          {total > RECENT_COUNT && (
            <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <MessageSquareQuote className="size-4 text-primary" aria-hidden="true" />
              {t('reviews.showingRecent', {
                shown: Math.min(RECENT_COUNT, reviews.length),
                total,
              })}
            </p>
          )}
          {total > SAMPLE_LIMIT && (
            <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Star className="size-3.5" aria-hidden="true" />
              {t('reviews.sampleNote', { limit: SAMPLE_LIMIT })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
