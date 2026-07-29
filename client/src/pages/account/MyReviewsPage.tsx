import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareQuote, PencilLine, Star } from 'lucide-react';
import { useMyReviews } from '@/hooks/account';
import EmptyState from '@/components/shared/EmptyState';
import ReviewModal from '@/components/account/ReviewModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/utils/formatDate';
import type { ReviewItem } from '@/types/account.types';

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700',
  hidden: 'bg-slate-500/10 text-slate-600',
};

export default function MyReviewsPage() {
  const { t } = useTranslation('account');
  const { data, isLoading } = useMyReviews();
  const [editing, setEditing] = useState<ReviewItem | null>(null);

  const statusLabel = (status: string) =>
    status === 'pending'
      ? t('reviews.pendingReview')
      : status === 'hidden'
        ? t('reviews.hidden')
        : '';

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">{t('reviews.title')}</h2>
      </div>
      <p className="mt-1 text-sm text-on-surface-variant">
        {t('reviews.subtitle')}
      </p>

      {/* List */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Star}
            title={t('reviews.emptyTitle')}
            description={t('reviews.emptyDesc')}
          />
        ) : (
          data.map(r => {
            const badgeClass = STATUS_CLASS[r.status];
            const badgeLabel = statusLabel(r.status);
            return (
              <div key={r.id} className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-be-vietnam font-semibold text-on-surface">{r.hotelName}</h3>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                      <span>
                        {r.bookingCode} · {formatDateShort(r.createdAt)}
                      </span>
                      {badgeClass && (
                        <span className={`rounded-full px-2 py-0.5 font-medium ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {/* Điểm đánh giá thang 10 (không dùng 5 sao) */}
                    <span className="inline-flex items-center rounded-lg bg-premium-gold px-2 py-0.5 text-sm font-bold text-on-surface">
                      {r.overallRating.toFixed(1)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(r)}
                    >
                      <PencilLine className="size-3.5" /> {t('reviews.editFeedback')}
                    </Button>
                  </div>
                </div>
                {r.title && <p className="mt-2 font-medium text-on-surface">{r.title}</p>}
                <p className="mt-1 text-sm text-on-surface-variant">{r.content}</p>

                {r.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.images.map((url, i) => (
                      <img key={i} src={url} alt="" className="size-20 rounded-lg border object-cover" />
                    ))}
                  </div>
                )}

                {r.managerResponse && (
                  <div className="mt-3 flex gap-2 rounded-xl bg-surface-container-low p-3">
                    <MessageSquareQuote className="size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-on-surface">{t('reviews.responseFromProperty')}</p>
                      <p className="text-sm text-on-surface-variant">{r.managerResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit feedback modal */}
      <ReviewModal
        open={!!editing}
        onClose={() => setEditing(null)}
        bookingId={editing?.bookingId ?? ''}
        hotelName={editing?.hotelName ?? ''}
        bookingCode={editing?.bookingCode ?? ''}
        existingReview={editing}
      />
    </div>
  );
}
