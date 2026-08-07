import { useState } from 'react';
import { CreditCard, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHotelPayouts } from '@/hooks/payouts';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { PAYOUT_STATUS_CONFIG } from './payout-labels';

const PAGE_SIZE = 8;

interface WithdrawalHistoryCardProps {
  hotelId: string;
}

export function WithdrawalHistoryCard({ hotelId }: WithdrawalHistoryCardProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useHotelPayouts(hotelId, {
    page,
    limit: PAGE_SIZE,
  });

  const rows = data?.results ?? [];
  const total = data?.totalResults ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <h2 className="font-semibold text-slate-900">Payout History</h2>
        <span className="text-xs text-slate-400">
          {total} request{total === 1 ? '' : 's'}
        </span>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <ErrorState
            label="Failed to load payout requests."
            className="py-4"
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading && !data ? (
        <div className="p-6">
          <TableSkeleton rows={4} columns={5} />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <CreditCard className="h-7 w-7 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">
            You have not requested a payout yet
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(p => {
                  const status = PAYOUT_STATUS_CONFIG[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="whitespace-nowrap font-semibold tabular-nums text-slate-800">
                          {formatCurrency(p.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">
                              <Pill tone={status.tone}>{status.label}</Pill>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64 text-xs">
                            {status.hint}
                          </TooltipContent>
                        </Tooltip>
                        {p.processedAt && (
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(p.processedAt)}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="text-xs text-slate-500">
                          {p.notes ?? (
                            <span className="italic text-slate-300">—</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
              <span>
                Page {page} of {totalPages}
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

      <p className="flex items-start gap-2 border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          The platform reviews each request and transfers manually, so it is not
          instant. A declined request returns the amount to your available
          balance.
        </span>
      </p>
    </div>
  );
}
