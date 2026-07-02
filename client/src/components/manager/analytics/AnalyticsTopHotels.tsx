import { useState } from 'react';
import { Hotel } from 'lucide-react';
import type { PlatformAnalytics } from '@/types/analytics.types';
import { TOP_HOTELS_PREVIEW, formatNumber } from './helpers';
import { EmptyBlock } from './states';

interface AnalyticsTopHotelsProps {
  topHotels: PlatformAnalytics['topHotels'];
}

export function AnalyticsTopHotels({ topHotels }: AnalyticsTopHotelsProps) {
  const [showAll, setShowAll] = useState(false);

  const maxBookings = Math.max(1, ...topHotels.map(h => h.bookings));
  const visible = showAll ? topHotels : topHotels.slice(0, TOP_HOTELS_PREVIEW);

  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Hotel className="w-5 h-5 text-role-manager-primary" />
          <h2 className="font-semibold text-slate-900">Top Hotels by Bookings</h2>
        </div>
        {topHotels.length > TOP_HOTELS_PREVIEW && (
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            className="text-xs font-medium text-role-manager-primary hover:underline"
          >
            {showAll ? 'Show less' : `Show all (${topHotels.length})`}
          </button>
        )}
      </div>
      {topHotels.length === 0 ? (
        <EmptyBlock label="No bookings yet" />
      ) : (
        <div className="space-y-3">
          {visible.map((h, i) => (
            <div key={h.hotelId} className="flex items-center gap-3">
              <span className="w-5 text-xs font-semibold text-slate-400 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm text-slate-700 truncate">{h.name}</span>
                  <span className="text-sm font-semibold text-slate-900 shrink-0">
                    {formatNumber(h.bookings)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-role-manager-primary"
                    style={{ width: `${(h.bookings / maxBookings) * 100}%` }}
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
