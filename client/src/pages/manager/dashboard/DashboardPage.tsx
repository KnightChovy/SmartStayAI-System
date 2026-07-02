import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Download, FileText, Sheet } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCsv } from '@/utils/exportCsv';
import type { DashboardRange } from '@/types/dashboard.types';
import {
  useDashboardSummary,
  useDashboardTimeSeries,
  useDashboardVerifications,
  useDashboardAlerts,
  useTopHotels,
  useRecentActivity,
} from '@/hooks/dashboard';
import {
  DashboardDateRangePicker,
  resolveDashboardPreset,
  type DashboardPreset,
  DashboardSearch,
  DashboardKpiCards,
  RevenueTrendChart,
  BookingsBarChart,
  UsersGrowthChart,
  PendingQueueCard,
  RecentVerifications,
  PolicyAlerts,
  TopHotelsWidget,
  RecentActivity,
} from '@/components/manager/dashboard';

const VALID_PRESETS: DashboardPreset[] = [
  'today',
  'thisWeek',
  'thisMonth',
  'thisQuarter',
  'thisYear',
  'custom',
];

export default function ManagerDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // AC-3: range/preset giữ trong URL query params (persist khi reload).
  const rawPreset = searchParams.get('preset') as DashboardPreset | null;
  const preset: DashboardPreset =
    rawPreset && VALID_PRESETS.includes(rawPreset) ? rawPreset : 'thisMonth';

  const range: DashboardRange = useMemo(() => {
    if (preset === 'custom') {
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      if (from && to) return { from, to };
      return resolveDashboardPreset('thisMonth');
    }
    return resolveDashboardPreset(preset);
  }, [preset, searchParams]);

  const handleRangeChange = (next: DashboardRange, nextPreset: DashboardPreset) => {
    const params = new URLSearchParams(searchParams);
    params.set('preset', nextPreset);
    if (nextPreset === 'custom') {
      params.set('from', next.from);
      params.set('to', next.to);
    } else {
      params.delete('from');
      params.delete('to');
    }
    setSearchParams(params);
  };

  const summary = useDashboardSummary(range);
  const timeSeries = useDashboardTimeSeries(range);
  const verifications = useDashboardVerifications(range);
  const alerts = useDashboardAlerts();
  const topHotels = useTopHotels(range);
  const activity = useRecentActivity();

  const pendingCount = (verifications.data ?? []).filter(v => v.status === 'pending').length;

  const handleExportCsv = () => {
    const rows = topHotels.data ?? [];
    if (rows.length === 0) {
      toast.error('No data to export for the selected period');
      return;
    }
    exportToCsv(
      `dashboard-top-hotels-${range.from}_${range.to}`,
      [
        { header: 'Hotel', value: h => h.name },
        { header: 'Revenue (VND)', value: h => h.revenue },
        { header: 'Bookings', value: h => h.bookings },
      ],
      rows
    );
    toast.success('CSV exported');
  };

  const handleExportPdf = () => {
    toast.info('Opening print dialog — choose "Save as PDF"');
    setTimeout(() => window.print(), 250);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
            <p className="text-slate-500 text-sm mt-1">Monitor and manage the SmartStay AI platform</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <DashboardSearch />
            <div className="flex items-center gap-2">
              <DashboardDateRangePicker value={range} preset={preset} onChange={handleRangeChange} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium text-white bg-role-manager-primary rounded-lg px-3 py-2 hover:bg-role-manager-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-role-manager-primary"
                  >
                    <Download className="w-4 h-4" /> Export
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCsv}>
                    <Sheet className="w-4 h-4" /> Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPdf}>
                    <FileText className="w-4 h-4" /> Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardKpiCards
        data={summary.data}
        isLoading={summary.isLoading}
        isError={summary.isError}
        onRetry={() => summary.refetch()}
      />

      {/* Pending queue + Revenue trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PendingQueueCard pendingCount={pendingCount} isLoading={verifications.isLoading} />
        <div className="lg:col-span-2">
          <RevenueTrendChart
            data={timeSeries.data}
            isLoading={timeSeries.isLoading}
            isError={timeSeries.isError}
            onRetry={() => timeSeries.refetch()}
          />
        </div>
      </div>

      {/* Bookings + Users growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingsBarChart
          data={timeSeries.data}
          isLoading={timeSeries.isLoading}
          isError={timeSeries.isError}
          onRetry={() => timeSeries.refetch()}
        />
        <UsersGrowthChart
          data={timeSeries.data}
          isLoading={timeSeries.isLoading}
          isError={timeSeries.isError}
          onRetry={() => timeSeries.refetch()}
        />
      </div>

      {/* Verifications + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentVerifications
          data={verifications.data}
          isLoading={verifications.isLoading}
          isError={verifications.isError}
          onRetry={() => verifications.refetch()}
        />
        <PolicyAlerts
          data={alerts.data}
          isLoading={alerts.isLoading}
          isError={alerts.isError}
          onRetry={() => alerts.refetch()}
        />
      </div>

      {/* Top hotels + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopHotelsWidget
          data={topHotels.data}
          isLoading={topHotels.isLoading}
          isError={topHotels.isError}
          onRetry={() => topHotels.refetch()}
        />
        <RecentActivity
          data={activity.data}
          isLoading={activity.isLoading}
          isError={activity.isError}
          onRetry={() => activity.refetch()}
        />
      </div>
    </div>
  );
}
