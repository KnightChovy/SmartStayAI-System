import { MessageSquareQuote, Star } from 'lucide-react';
import { useMyReviews } from '@/hooks/account';
import StarRating from '@/components/shared/StarRating';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateShort } from '@/utils/formatDate';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending review', className: 'bg-amber-500/10 text-amber-700' },
  hidden: { label: 'Hidden', className: 'bg-slate-500/10 text-slate-600' },
};

export default function MyReviewsPage() {
  const { data, isLoading } = useMyReviews();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">My reviews</h2>
      </div>
      <p className="mt-1 text-sm text-on-surface-variant">
        Reviews you’ve shared after completed stays. Write a new one from a stay in{' '}
        <span className="font-medium text-on-surface">My bookings</span>.
      </p>

      {/* List */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Share your experience after a completed stay from My bookings."
          />
        ) : (
          data.map(r => {
            const badge = STATUS_LABEL[r.status];
            return (
              <div key={r.id} className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-be-vietnam font-semibold text-on-surface">{r.hotelName}</h3>
                  <StarRating value={r.overallRating} size={16} />
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                  <span>
                    {r.bookingCode} · {formatDateShort(r.createdAt)}
                  </span>
                  {badge && (
                    <span className={`rounded-full px-2 py-0.5 font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </p>
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
                      <p className="text-xs font-semibold text-on-surface">Response from property</p>
                      <p className="text-sm text-on-surface-variant">{r.managerResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
