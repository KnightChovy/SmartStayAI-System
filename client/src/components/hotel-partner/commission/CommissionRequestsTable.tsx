import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  type Column,
} from '@/components/hotel-partner/shared/DataTable';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import {
  EmptyState,
  ErrorState,
} from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import {
  COMMISSION_STATUS_CONFIG,
  formatRate,
} from '@/components/shared/commission-labels';
import { useHotelCommissionRequests } from '@/hooks/commission-rate';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import type {
  CommissionRateRequest,
  CommissionRequestStatus,
} from '@/types/commission-rate.types';

const PAGE_SIZE = 10;

type FilterStatus = 'all' | CommissionRequestStatus;

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

interface CommissionRequestsTableProps {
  hotelId: string;
}

/** Lịch sử đơn xin giảm hoa hồng của một khách sạn (mới nhất trước). */
export function CommissionRequestsTable({
  hotelId,
}: CommissionRequestsTableProps) {
  const [status, setStatus] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useHotelCommissionRequests(
    hotelId,
    {
      status: status === 'all' ? undefined : status,
      page,
      limit: PAGE_SIZE,
    }
  );

  const rows = useMemo(() => data?.results ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  const changeFilter = (next: FilterStatus) => {
    setStatus(next);
    setPage(1);
  };

  const columns = useMemo<Column<CommissionRateRequest>[]>(
    () => [
      {
        id: 'createdAt',
        header: 'Submitted',
        cell: r => (
          <div>
            <p className="text-slate-700">{formatDate(r.createdAt)}</p>
            {r.isRenewal && (
              <Pill tone="blue" className="mt-1">
                Renewal
              </Pill>
            )}
          </div>
        ),
      },
      {
        id: 'requestedRate',
        header: 'Requested',
        align: 'right',
        cell: r => (
          <span className="font-semibold tabular-nums text-slate-800">
            {formatRate(r.requestedRate)}
          </span>
        ),
      },
      {
        id: 'currentRate',
        header: 'Compared against',
        align: 'right',
        cell: r => (
          <span className="tabular-nums text-slate-500">
            {formatRate(r.currentRate)}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: r => {
          const cfg = COMMISSION_STATUS_CONFIG[r.status];
          const Icon = cfg.icon;
          return (
            <div className="flex flex-col items-start gap-1">
              <Pill className={cfg.class}>
                <Icon className="h-3 w-3" />
                {cfg.label}
              </Pill>
              {r.reviewedAt && (
                <span className="text-[10px] text-slate-400">
                  {formatDate(r.reviewedAt)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'agreement',
        header: 'Rate applied',
        cell: r =>
          r.agreement ? (
            <div className="text-xs text-slate-600">
              <p className="font-medium">{formatRate(r.agreement.rate)}</p>
              <p className="text-slate-400">
                {formatDate(r.agreement.effectiveFrom)} →{' '}
                {r.agreement.effectiveTo
                  ? formatDate(r.agreement.effectiveTo)
                  : '—'}
              </p>
            </div>
          ) : (
            <span className="text-slate-300">—</span>
          ),
      },
      {
        id: 'rejectionReason',
        header: 'Rejection reason',
        cell: r =>
          r.rejectionReason ? (
            <p
              className="max-w-[260px] truncate text-xs text-red-600"
              title={r.rejectionReason}
            >
              {r.rejectionReason}
            </p>
          ) : (
            <span className="text-slate-300">—</span>
          ),
        className: 'max-w-[280px]',
      },
    ],
    []
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Request history</h2>
          <p className="text-sm text-slate-500">
            Every commission request submitted for this hotel
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => changeFilter(f.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-all',
                status === f.value
                  ? 'bg-role-partner-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {isError ? (
          <div className="flex flex-col items-center gap-3">
            <ErrorState
              label="Failed to load the request history."
              className="pb-4"
            />
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : isLoading && !data ? (
          <TableSkeleton rows={4} columns={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No requests yet"
            description={
              status === 'all'
                ? 'This hotel has never requested a lower commission rate.'
                : 'There are no requests with this status.'
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={r => r.id}
              minWidthClass="min-w-[840px]"
            />
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>
                  Page {data?.page ?? 1} of {totalPages} · {totalResults}{' '}
                  request
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
