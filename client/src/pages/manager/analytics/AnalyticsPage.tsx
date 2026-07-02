import { useState } from 'react';
import { BarChart2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePlatformAnalytics } from '@/hooks/analytics';
import type { PlatformAnalyticsParams } from '@/types/analytics.types';
import {
  AnalyticsKpiCards,
  AnalyticsTrendChart,
  AnalyticsTopHotels,
  AnalyticsTopCities,
  AnalyticsSkeleton,
} from '@/components/manager/analytics';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<PlatformAnalyticsParams['period']>('month');
  // topLimit 10 để nút "Show all" ở Top Hotels có ý nghĩa khi data thật nhiều hơn (A5).
  const { data, isLoading, isFetching, isError, refetch } = usePlatformAnalytics({
    period,
    topLimit: 10,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-role-manager-light rounded-lg">
              <BarChart2 className="w-6 h-6 text-role-manager-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
              <p className="text-slate-500 text-sm">
                Bookings, conversion and growth across the whole platform
              </p>
            </div>
          </div>

          {/* Period toggle — đổi period gọi lại API (query key đổi theo param) (A8) */}
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
            {(['month', 'year'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  period === p
                    ? 'bg-role-manager-primary text-white'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {p === 'month' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isError ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-slate-800 font-medium">Couldn't load analytics</p>
          <p className="text-slate-500 text-sm mt-1">Please try again in a moment.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-role-manager-primary text-white hover:bg-role-manager-secondary transition-colors"
          >
            Retry
          </button>
        </div>
      ) : isLoading || !data ? (
        <AnalyticsSkeleton />
      ) : (
        <div className={cn('space-y-6 transition-opacity', isFetching && 'opacity-60')}>
          <AnalyticsKpiCards
            totals={data.totals}
            timeSeries={data.timeSeries}
            period={period ?? 'month'}
          />
          <AnalyticsTrendChart timeSeries={data.timeSeries} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AnalyticsTopHotels topHotels={data.topHotels} />
            <AnalyticsTopCities topCities={data.topCities} />
          </div>
        </div>
      )}
    </div>
  );
}
