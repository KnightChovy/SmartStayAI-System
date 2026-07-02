import { useState } from 'react';
import { Link } from 'react-router';
import { ShieldCheck, Eye, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import type { DashboardVerification } from '@/types/dashboard.types';
import { useReviewVerification } from '@/hooks/dashboard';
import { VERIFICATION_STATUS_CONFIG } from './labels';
import { ListCardSkeleton, SectionEmpty, SectionError } from './states';

interface RecentVerificationsProps {
  data: DashboardVerification[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface PendingAction {
  item: DashboardVerification;
  decision: 'approve' | 'reject';
}

export function RecentVerifications({ data, isLoading, isError, onRetry }: RecentVerificationsProps) {
  const [action, setAction] = useState<PendingAction | null>(null);
  const review = useReviewVerification();

  if (isLoading) return <ListCardSkeleton rows={4} />;

  const confirmReview = () => {
    if (!action) return;
    review.mutate(
      { id: action.item.id, decision: action.decision },
      {
        onSuccess: () => {
          toast.success(
            action.decision === 'approve' ? 'Verification approved' : 'Verification rejected'
          );
          setAction(null);
        },
        onError: err => toast.error(errorMessage(err, 'Action failed, please try again')),
      }
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-role-manager-primary" />
          <h2 className="font-semibold text-slate-900">Recent Verifications</h2>
        </div>
        <Link
          to="/manager/verification"
          className="text-xs text-role-manager-primary font-medium hover:underline"
        >
          View all →
        </Link>
      </div>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : !data || data.length === 0 ? (
        <SectionEmpty icon={ShieldCheck} title="No verification requests" description="New submissions will show up here." />
      ) : (
        <div className="space-y-2.5">
          {data.map(v => {
            const cfg = VERIFICATION_STATUS_CONFIG[v.status];
            return (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{v.hotelName}</p>
                  <p className="text-xs text-slate-500">
                    {v.code} · {formatDate(v.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {v.status === 'pending' ? (
                    <>
                      <Link
                        to="/manager/verification"
                        aria-label={`View ${v.code}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-role-manager-primary"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setAction({ item: v, decision: 'approve' })}
                        aria-label={`Approve ${v.code}`}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAction({ item: v, decision: 'reject' })}
                        aria-label={`Reject ${v.code}`}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.class)}>
                      {cfg.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!action}
        onClose={() => setAction(null)}
        onConfirm={confirmReview}
        loading={review.isPending}
        destructive={action?.decision === 'reject'}
        confirmLabel={action?.decision === 'approve' ? 'Approve' : 'Reject'}
        title={action?.decision === 'approve' ? 'Approve verification' : 'Reject verification'}
        message={
          action
            ? `Are you sure you want to ${action.decision} the verification for "${action.item.hotelName}" (${action.item.code})?`
            : ''
        }
      />
    </div>
  );
}
