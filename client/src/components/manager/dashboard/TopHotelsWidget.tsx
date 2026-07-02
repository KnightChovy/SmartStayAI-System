import { Hotel } from 'lucide-react';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { TopHotel } from '@/types/dashboard.types';
import { formatCount } from './helpers';
import { ListCardSkeleton, SectionEmpty, SectionError } from './states';

interface TopHotelsWidgetProps {
  data: TopHotel[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/** AC-8: Top hotels theo revenue trong range. */
export function TopHotelsWidget({ data, isLoading, isError, onRetry }: TopHotelsWidgetProps) {
  if (isLoading) return <ListCardSkeleton rows={5} />;

  const max = Math.max(1, ...(data?.map(h => h.revenue) ?? [1]));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Hotel className="w-5 h-5 text-role-manager-primary" />
        <h2 className="font-semibold text-slate-900">Top Hotels by Revenue</h2>
      </div>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : !data || data.length === 0 ? (
        <SectionEmpty icon={Hotel} title="No revenue yet" />
      ) : (
        <div className="space-y-3">
          {data.map((h, i) => (
            <div key={h.hotelId} className="flex items-center gap-3">
              <span className="w-5 text-xs font-semibold text-slate-400 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm text-slate-700 truncate">{h.name}</span>
                  <span className="text-sm font-semibold text-slate-900 shrink-0" title={formatVndFull(h.revenue)}>
                    {formatCompactVnd(h.revenue)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-role-manager-primary"
                    style={{ width: `${(h.revenue / max) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{formatCount(h.bookings)} bookings</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
