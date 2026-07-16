import { Hotel } from 'lucide-react';
import type { TopHotel } from '@/types/dashboard.types';
import { formatCount } from './helpers';
import { ListCardSkeleton, SectionEmpty, SectionError } from './states';

interface TopHotelsWidgetProps {
  data: TopHotel[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * Top khách sạn theo SỐ BOOKING (`GET /platform-manager/analytics` → `topHotels`).
 *
 * Xếp theo booking chứ không phải doanh thu, và ghi rõ "all time": BE không có doanh thu
 * theo khách sạn ở phạm vi toàn sàn, `topHotels` cũng không lọc theo khoảng thời gian.
 */
export function TopHotelsWidget({ data, isLoading, isError, onRetry }: TopHotelsWidgetProps) {
  if (isLoading) return <ListCardSkeleton rows={5} />;

  const max = Math.max(1, ...(data?.map(h => h.bookings) ?? [1]));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Hotel className="w-5 h-5 text-role-manager-primary" />
        <h2 className="font-semibold text-slate-900">Top Hotels by Bookings</h2>
      </div>
      <p className="text-xs text-slate-500 mb-5">All time · not filtered by the date range</p>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : !data || data.length === 0 ? (
        <SectionEmpty icon={Hotel} title="No bookings yet" />
      ) : (
        <div className="space-y-3">
          {data.map((h, i) => (
            <div key={h.hotelId} className="flex items-center gap-3">
              <span className="w-5 text-xs font-semibold text-slate-400 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm text-slate-700 truncate">{h.name}</span>
                  <span className="text-sm font-semibold text-slate-900 shrink-0">
                    {formatCount(h.bookings)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-role-manager-primary"
                    style={{ width: `${(h.bookings / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
