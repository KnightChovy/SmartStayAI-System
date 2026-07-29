import { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useHotelReviews, useHotelReviewStats } from '@/hooks/hotel-reviews';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import type {
  HotelReview,
  HotelReviewStatus,
  ReviewScoreBucket,
} from '@/types/hotel-review.types';
import { REVIEW_STATUS_CONFIG, REVIEW_STATUS_OPTIONS } from './labels';

const PAGE_SIZE = 10;

interface ReviewsTabProps {
  hotelId: string;
}

/**
 * Nội dung tab Reviews của MỘT khách sạn (read-only): thống kê tổng hợp + lọc
 * status + danh sách review có phân trang. Nối `GET /hotels/:id/reviews` + `/reviews/stats`.
 */
export function ReviewsTab({ hotelId }: ReviewsTabProps) {
  const [status, setStatus] = useState<HotelReviewStatus | ''>('');
  const [page, setPage] = useState(1);

  const statsQuery = useHotelReviewStats(hotelId);
  const listQuery = useHotelReviews(hotelId, {
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy: 'createdAt:desc',
  });

  const stats = statsQuery.data;
  const list = listQuery.data;

  const changeStatus = (value: HotelReviewStatus | '') => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ─── Stats ─── */}
      {statsQuery.isError ? (
        <ErrorState label="Failed to load review stats." />
      ) : statsQuery.isLoading || !stats ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Overall */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">Overall rating</p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-amber-500">
              {stats.average.overall !== null ? stats.average.overall.toFixed(1) : '—'}
            </p>
            <Stars value={stats.average.overall ?? 0} />
            <p className="mt-2 text-xs text-slate-400">
              out of 10 · {stats.total} published review(s)
            </p>
          </div>

          {/* Category averages */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              By category
            </h3>
            <div className="space-y-2.5">
              <CategoryRow label="Cleanliness" value={stats.average.cleanliness} />
              <CategoryRow label="Service" value={stats.average.service} />
              <CategoryRow label="Location" value={stats.average.location} />
              <CategoryRow label="Value" value={stats.average.value} />
            </div>
          </div>

          {/* Star distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Distribution
            </h3>
            <div className="space-y-1.5">
              {(['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'] as ReviewScoreBucket[]).map(
                bucket => {
                  const count = stats.countByStar[bucket];
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={bucket} className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-right tabular-nums text-slate-500">{bucket}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right tabular-nums text-slate-400">{count}</span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Filter + list ─── */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Reviews</h2>
        <select
          value={status}
          onChange={e => changeStatus(e.target.value as HotelReviewStatus | '')}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600"
        >
          {REVIEW_STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {listQuery.isError ? (
        <ErrorState label="Failed to load reviews." />
      ) : listQuery.isLoading && !list ? (
        <ListSkeleton rows={4} />
      ) : list && list.results.length > 0 ? (
        <>
          <div className="space-y-4">
            {list.results.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {list.page} of {list.totalPages} · {list.totalResults} reviews
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={list.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={list.page >= list.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="Guest reviews for this hotel will appear here once they are submitted."
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Điểm thang 10 → 5 sao (chia 2) chỉ để hiển thị trực quan; số /10 luôn hiện kèm bên cạnh. */
function Stars({ value }: { value: number }) {
  const outOfFive = Math.round(value / 2);
  return (
    <div className="mt-1 flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < outOfFive ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
          )}
        />
      ))}
    </div>
  );
}

function CategoryRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-800">
        {value !== null ? `${value.toFixed(1)}/10` : '—'}
      </span>
    </div>
  );
}

function ReviewCard({ review }: { review: HotelReview }) {
  const cfg = REVIEW_STATUS_CONFIG[review.status];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {review.customer?.fullName ?? 'Guest'}
          </p>
          <p className="text-xs text-slate-400">{formatDate(review.createdAt)}</p>
        </div>
        <Pill tone={cfg.tone}>{cfg.label}</Pill>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <Stars value={review.overallRating} />
        <span className="text-sm font-semibold text-slate-700">
          {review.overallRating.toFixed(1)}
        </span>
      </div>

      {review.title && <p className="font-medium text-slate-800">{review.title}</p>}
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{review.content}</p>

      {review.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.images.map(img => (
            <img
              key={img.id}
              src={img.url}
              alt="Review"
              className="h-16 w-16 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <SubRating label="Cleanliness" value={review.cleanlinessRating} />
        <SubRating label="Service" value={review.serviceRating} />
        <SubRating label="Location" value={review.locationRating} />
        <SubRating label="Value" value={review.valueRating} />
      </div>
    </div>
  );
}

function SubRating({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1">
      {label}:
      <span className="font-medium text-slate-700">{value}/10</span>
    </span>
  );
}
