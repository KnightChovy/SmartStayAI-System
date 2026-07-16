import { useMemo, useState } from 'react';
import { CheckCircle2, Eye, RotateCcw, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DataTable,
  type Column,
} from '@/components/hotel-partner/shared/DataTable';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ActionMenu } from '@/components/hotel-partner/shared/ActionMenu';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import {
  EmptyState,
  ErrorState,
} from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import {
  REFUND_STATUS_CONFIG,
  REVIEW_DEADLINE_DAYS,
  isPartialRefund,
  isSystemReviewed,
  reviewDeadlineInfo,
} from '@/components/shared/refund-labels';
import { useHotelRefunds, useReviewRefund } from '@/hooks/refunds';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { Refund, RefundStatus } from '@/types/refund.types';
import { RefundDetailModal } from './RefundDetailModal';
import { RejectRefundModal } from './RejectRefundModal';

const PAGE_SIZE = 10;

type FilterStatus = 'all' | RefundStatus;

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'pending', label: 'Needs review' },
  { value: 'approved', label: 'Approved' },
  { value: 'processed', label: 'Transferred' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

interface RefundsTabProps {
  hotelId: string;
}

export function RefundsTab({ hotelId }: RefundsTabProps) {
  const [status, setStatus] = useState<FilterStatus>('pending');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Refund | null>(null);
  const [approving, setApproving] = useState<Refund | null>(null);
  const [rejecting, setRejecting] = useState<Refund | null>(null);

  const { data, isLoading, isError, refetch } = useHotelRefunds(hotelId, {
    status: status === 'all' ? undefined : status,
    page,
    limit: PAGE_SIZE,
  });

  const reviewMutation = useReviewRefund();

  const refunds = useMemo(() => data?.results ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  // BE không có search — lọc client-side trên trang hiện tại (xem docs/refund-api-spec.md §8).
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return refunds;
    return refunds.filter(
      r =>
        r.payment.booking.bookingCode.toLowerCase().includes(q) ||
        r.requesterUser.fullName.toLowerCase().includes(q) ||
        r.requesterUser.email.toLowerCase().includes(q)
    );
  }, [refunds, search]);

  const changeFilter = (next: FilterStatus) => {
    setStatus(next);
    setPage(1);
  };

  const confirmApprove = async () => {
    if (!approving) return;
    try {
      await reviewMutation.mutateAsync({
        hotelId,
        refundId: approving.id,
        dto: { decision: 'approve' },
      });
      toast.success(
        'Refund approved — the Platform Manager will transfer the money'
      );
    } catch (err) {
      // BE message tiếng Việt và có nghĩa với người dùng (vd "Yêu cầu này đã được xét duyệt rồi")
      // — hiển thị nguyên văn. Hook đã invalidate ở onSettled nên danh sách tự làm mới.
      toast.error(errorMessage(err, 'Failed to approve this refund request'));
    } finally {
      setApproving(null);
      setSelected(null);
    }
  };

  const columns = useMemo<Column<Refund>[]>(
    () => [
      {
        id: 'booking',
        header: 'Booking',
        cell: r => (
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-slate-800">
              {r.payment.booking.bookingCode}
            </p>
            <p className="truncate text-xs text-slate-400">
              {r.payment.booking.roomType.name}
            </p>
          </div>
        ),
      },
      {
        id: 'guest',
        header: 'Guest',
        cell: r => (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-700">
              {r.requesterUser.fullName}
            </p>
            <p className="truncate text-xs text-slate-400">
              {r.requesterUser.phone ?? r.requesterUser.email}
            </p>
          </div>
        ),
        className: 'max-w-[180px]',
      },
      {
        id: 'paid',
        header: 'Paid',
        align: 'right',
        cell: r => (
          <span className="tabular-nums text-slate-500">
            {formatCurrency(r.payment.amount)}
          </span>
        ),
      },
      {
        id: 'amount',
        header: 'Refund',
        align: 'right',
        cell: r => (
          <div className="flex flex-col items-end gap-1">
            <span className="font-semibold tabular-nums text-red-600">
              {formatCurrency(r.amount)}
            </span>
            {isPartialRefund(r) && <Pill tone="amber">Partial</Pill>}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: r => {
          const cfg = REFUND_STATUS_CONFIG[r.status];
          const Icon = cfg.icon;
          return (
            <div className="flex flex-col items-start gap-1">
              <Pill className={cfg.class}>
                <Icon className="h-3 w-3" />
                {cfg.label}
              </Pill>
              {isSystemReviewed(r) && r.status !== 'pending' && (
                <span className="text-[10px] text-slate-400">
                  Auto by system
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'deadline',
        header: 'Requested',
        cell: r => {
          if (r.status !== 'pending') {
            return (
              <span className="text-xs text-slate-500">
                {formatDate(r.createdAt)}
              </span>
            );
          }
          const d = reviewDeadlineInfo(r.createdAt);
          return (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">
                {formatDate(r.createdAt)}
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  d.urgent ? 'text-red-600' : 'text-slate-400'
                )}
                title={`Auto-approves on ${formatDate(d.deadline.toISOString())} if you don't respond`}
              >
                {d.label}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        align: 'right',
        cell: r => (
          <ActionMenu
            vertical
            triggerVariant="ghost"
            items={
              r.status === 'pending'
                ? [
                    {
                      label: 'View details',
                      icon: Eye,
                      onClick: () => setSelected(r),
                    },
                    {
                      label: 'Approve refund',
                      icon: CheckCircle2,
                      onClick: () => setApproving(r),
                    },
                    {
                      label: 'Reject refund',
                      icon: XCircle,
                      destructive: true,
                      onClick: () => setRejecting(r),
                    },
                  ]
                : [
                    {
                      label: 'View details',
                      icon: Eye,
                      onClick: () => setSelected(r),
                    },
                  ]
            }
          />
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => changeFilter(f.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                status === f.value
                  ? 'bg-role-partner-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {f.label}
              {f.value === 'pending' &&
                status === 'pending' &&
                totalResults > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-xs">
                    {totalResults}
                  </span>
                )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search booking code or guest..."
            className="pl-8.5"
          />
        </div>
      </div>

      {status === 'pending' && (
        <p className="text-xs text-slate-500">
          Approving does <strong>not</strong> move money — it authorises the
          Platform Manager to transfer it. You have {REVIEW_DEADLINE_DAYS} days
          to respond before the system approves automatically.
        </p>
      )}

      {/* Bảng */}
      {isError ? (
        <div className="flex flex-col items-center gap-3">
          <ErrorState
            label="Failed to load refund requests."
            className="pb-4"
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading && !data ? (
        <TableSkeleton rows={5} columns={7} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title={search ? 'No matching refund requests' : 'Nothing to review'}
          description={
            search
              ? 'No refund on this page matches your search.'
              : status === 'pending'
                ? 'No refund requests are waiting for your review.'
                : 'There are no refund requests with this status yet.'
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={r => r.id}
            minWidthClass="min-w-[880px]"
            onRowClick={setSelected}
          />
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {data?.page ?? 1} of {totalPages} · {totalResults} request
              {totalResults === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {selected && (
        <RefundDetailModal
          open
          onClose={() => setSelected(null)}
          refund={selected}
          onApprove={() => setApproving(selected)}
          onReject={() => setRejecting(selected)}
        />
      )}

      <ConfirmDialog
        open={!!approving}
        onClose={() => setApproving(null)}
        onConfirm={confirmApprove}
        loading={reviewMutation.isPending}
        title="Approve this refund?"
        confirmLabel="Approve refund"
        message={
          approving
            ? `${formatCurrency(approving.amount)} will be refunded to ${approving.requesterUser.fullName} for booking ${approving.payment.booking.bookingCode}. This authorises the Platform Manager to transfer the money — it cannot be undone.`
            : ''
        }
      />

      {rejecting && (
        <RejectRefundModal
          open
          onClose={() => {
            setRejecting(null);
            setSelected(null);
          }}
          hotelId={hotelId}
          refund={rejecting}
        />
      )}

      {isError && (
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      )}
    </div>
  );
}
