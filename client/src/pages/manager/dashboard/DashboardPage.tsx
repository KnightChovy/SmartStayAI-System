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
  useUsersGrowth,
  useDashboardVerifications,
  usePendingVerificationsCount,
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

  const handleRangeChange = (
    next: DashboardRange,
    nextPreset: DashboardPreset
  ) => {
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
  // Không theo date-range: endpoint analytics chỉ nhận số bucket lùi từ hiện tại.
  const usersGrowth = useUsersGrowth();
  const verifications = useDashboardVerifications();
  const pending = usePendingVerificationsCount();
  const alerts = useDashboardAlerts();
  const topHotels = useTopHotels();
  const activity = useRecentActivity();

  // Xuất CHUỖI DOANH THU theo range — đây là dữ liệu duy nhất trên trang thực sự đi theo
  // bộ lọc ngày, nên là thứ đáng export. (Top hotels là số liệu toàn thời gian.)
  const handleExportCsv = () => {
    const rows = timeSeries.data?.points ?? [];
    if (rows.length === 0) {
      toast.error('No data to export for the selected period');
      return;
    }
    exportToCsv(
      `dashboard-revenue-${range.from}_${range.to}`,
      [
        { header: 'Period', value: p => p.period },
        { header: 'Gross booking value (VND)', value: p => p.gmv },
        { header: 'Platform revenue (VND)', value: p => p.netRevenue },
        { header: 'Bookings', value: p => p.bookings },
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
            <h1 className="text-2xl font-bold text-slate-900">
              Platform Overview
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitor and manage the StayHub platform
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <DashboardSearch />
            <div className="flex items-center gap-2">
              <DashboardDateRangePicker
                value={range}
                preset={preset}
                onChange={handleRangeChange}
              />
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
        <PendingQueueCard
          pendingCount={pending.count}
          isLoading={pending.isLoading}
        />
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
          data={usersGrowth.data}
          isLoading={usersGrowth.isLoading}
          isError={usersGrowth.isError}
          onRetry={() => usersGrowth.refetch()}
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
