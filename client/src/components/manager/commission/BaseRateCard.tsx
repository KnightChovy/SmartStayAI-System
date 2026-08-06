import { useState } from 'react';
import { CalendarClock, History, Pencil, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/shared/skeletons';
import { formatRate } from '@/components/shared/commission-labels';
import { useBaseCommissionRate } from '@/hooks/platform-manager';
import { formatDate } from '@/utils/formatDate';
import { SetBaseRateModal } from './SetBaseRateModal';

/** Khối "mức nền toàn sàn": số hiện tại + lịch đã đặt + lịch sử + nút đặt mức mới. */
export function BaseRateCard() {
  const [editing, setEditing] = useState(false);
  const { data, isLoading, isError, refetch } = useBaseCommissionRate();

  if (isLoading && !data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <TableSkeleton rows={3} columns={3} className="border-0" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white py-14">
        <p className="text-sm text-slate-500">
          Failed to load the platform base commission rate.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-role-manager-light">
            <Percent className="h-6 w-6 text-role-manager-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Platform base commission rate
            </p>
            <p className="mt-0.5 text-4xl font-bold leading-none tracking-tight text-slate-900 tabular-nums">
              {formatRate(data.currentRate)}
            </p>
            <p className="mt-2 max-w-md text-xs text-slate-500">
              Applies to every hotel without its own negotiated rate. Allowed
              range {data.minRate}%–{data.maxRate}%.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setEditing(true)}
          className="shrink-0 bg-role-manager-primary text-white hover:bg-role-manager-secondary"
        >
          <Pencil className="mr-1.5 h-4 w-4" />
          Set new rate
        </Button>
      </div>

      {data.scheduled ? (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-3">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p className="text-xs text-blue-900">
            Scheduled: the base rate changes to{' '}
            <strong>{formatRate(data.scheduled.rate)}</strong> on{' '}
            <strong>{formatDate(data.scheduled.effectiveFrom)}</strong>. Setting
            a new rate before then replaces this schedule.
          </p>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-500">
          No base rate change is currently scheduled.
        </p>
      )}

      {/* Lịch sử */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Base rate history
          </h3>
        </div>
        {data.history.length === 0 ? (
          <p className="rounded-lg border border-slate-200 px-3.5 py-3 text-xs text-slate-400">
            No base rate has been recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Effective from</th>
                  <th className="px-4 py-3">Until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.history.map(rate => (
                  <tr key={rate.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold tabular-nums text-slate-800">
                      {formatRate(rate.rate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(rate.effectiveFrom)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {rate.effectiveTo ? (
                        formatDate(rate.effectiveTo)
                      ) : (
                        <span className="text-emerald-600">Current</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SetBaseRateModal
        open={editing}
        onClose={() => setEditing(false)}
        baseRate={data}
      />
    </div>
  );
}
