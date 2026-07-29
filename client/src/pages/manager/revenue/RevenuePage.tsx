import { useState } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useRevenueSummary, useRevenueTimeSeries } from '@/hooks/revenue';
import { exportToCsv } from '@/utils/exportCsv';
import type { DateRange } from '@/types/revenue.types';
import {
  RevenueDateRangePicker,
  resolvePreset,
  type RangePreset,
} from '@/components/manager/revenue/RevenueDateRangePicker';
import { RevenueKpiCards } from '@/components/manager/revenue/RevenueKpiCards';
import { RevenueVsCommissionChart } from '@/components/manager/revenue/RevenueVsCommissionChart';
import { RevenueCommissionSplit } from '@/components/manager/revenue/RevenueCommissionSplit';

export default function RevenuePage() {
  const [range, setRange] = useState<DateRange>(() => resolvePreset('thisMonth'));
  const [preset, setPreset] = useState<RangePreset>('thisMonth');
  const [compare, setCompare] = useState(false);

  const summary = useRevenueSummary(range);
  const timeSeries = useRevenueTimeSeries({ ...range, compare });

  const handleRangeChange = (next: DateRange, nextPreset: RangePreset) => {
    setRange(next);
    setPreset(nextPreset);
  };

  // Xuất chính chuỗi thời gian đang hiển thị — không gọi lại API, không xuất số khác trên màn hình.
  const handleExport = () => {
    const points = timeSeries.data?.points ?? [];
    if (points.length === 0) {
      toast.error('No data to export for the selected period');
      return;
    }
    exportToCsv(
      `revenue-${range.from}_${range.to}`,
      [
        { header: 'Period', value: p => p.period },
        { header: 'Gross Revenue (VND)', value: p => p.revenue },
        { header: 'Commission (VND)', value: p => p.commission },
        { header: 'Bookings', value: p => p.bookings },
      ],
      points
    );
    toast.success('CSV report exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-role-manager-light rounded-lg">
              <TrendingUp className="w-6 h-6 text-role-manager-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Platform Revenue</h1>
              <p className="text-slate-500 text-sm">Platform-wide revenue & commission over time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RevenueDateRangePicker value={range} preset={preset} onChange={handleRangeChange} />
            <button
              type="button"
              onClick={handleExport}
              disabled={timeSeries.isLoading}
              className="flex items-center gap-2 text-sm font-medium text-white bg-role-manager-primary rounded-lg px-3 py-2 hover:bg-role-manager-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <RevenueKpiCards
        data={summary.data}
        isLoading={summary.isLoading}
        isError={summary.isError}
        onRetry={() => summary.refetch()}
      />

      {/* Revenue vs Commission + commission status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueVsCommissionChart
          data={timeSeries.data}
          isLoading={timeSeries.isLoading}
          isError={timeSeries.isError}
          onRetry={() => timeSeries.refetch()}
          compare={compare}
          onToggleCompare={() => setCompare(c => !c)}
        />
        <RevenueCommissionSplit
          data={summary.data}
          isLoading={summary.isLoading}
          isError={summary.isError}
          onRetry={() => summary.refetch()}
        />
      </div>
    </div>
  );
}
