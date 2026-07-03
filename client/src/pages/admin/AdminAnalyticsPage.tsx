import { useState } from 'react';
import { toast } from 'sonner';
import { AdminAnalyticsCharts } from '@/components/admin/analytics/AdminAnalyticsCharts';
import { AdminAnalyticsHeader } from '@/components/admin/analytics/AdminAnalyticsHeader';
import { AdminAnalyticsKpiCard } from '@/components/admin/analytics/AdminAnalyticsKpiCard';
import { useAdminOverview } from '@/hooks/admin';
import { usePlatformAnalytics } from '@/hooks/analytics';
import { errorMessage } from '@/utils/errorMessage';
import { exportToCsv } from '@/utils/exportCsv';
import { formatCurrency } from '@/utils/formatCurrency';

export function AdminAnalyticsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const { data: overview, isLoading: isOverviewLoading, isError, error } =
    useAdminOverview();
  const { data: analytics, isLoading: isAnalyticsLoading } = usePlatformAnalytics({
    period: 'month',
    range: 8,
    topLimit: 5,
  });

  const isLoading = isOverviewLoading || isAnalyticsLoading;

  const handleExport = () => {
    const timeSeries = analytics?.timeSeries ?? [];
    if (timeSeries.length === 0) {
      toast.error('No data to export yet');
      return;
    }

    setIsExporting(true);
    try {
      exportToCsv(
        `market-intelligence-${analytics?.period ?? 'month'}`,
        [
          { header: 'Period', value: row => row.period },
          { header: 'Bookings', value: row => row.bookings },
          { header: 'Confirmed Bookings', value: row => row.confirmedBookings },
          { header: 'New Users', value: row => row.newUsers },
        ],
        timeSeries
      );
      toast.success('CSV report exported');
    } catch {
      toast.error('CSV export failed, please try again');
    } finally {
      setIsExporting(false);
    }
  };

  const kpis = [
    {
      label: 'Platform GMV',
      value: formatCurrency(overview?.revenue.gmv),
      delta: `${overview?.bookings.thisMonth ?? 0} bookings this month`,
    },
    {
      label: 'Total Bookings',
      value: (analytics?.totals.totalBookings ?? 0).toLocaleString('en-US'),
      delta: `${analytics?.totals.confirmedBookings ?? 0} confirmed`,
    },
    {
      label: 'New Users',
      value: (overview?.users.newThisMonth ?? 0).toLocaleString('en-US'),
      delta: `${overview?.users.total ?? 0} total users`,
    },
    {
      label: 'Conversion Rate',
      value: `${((analytics?.totals.conversionRate ?? 0) * 100).toFixed(1)}%`,
      delta: 'confirmed / total bookings',
    },
  ];

  return (
    <div className="space-y-6">
      <AdminAnalyticsHeader
        description="Global performance overview across all listed hotels"
        isExporting={isExporting}
        onExport={handleExport}
        title="Market Intelligence"
      />

      {isError && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage(error, 'Could not load platform overview.')}
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(kpi => (
          <AdminAnalyticsKpiCard key={kpi.label} {...kpi} value={isLoading ? '—' : kpi.value} />
        ))}
      </section>

      <AdminAnalyticsCharts
        isLoading={isAnalyticsLoading}
        timeSeries={analytics?.timeSeries ?? []}
        topCities={analytics?.topCities ?? []}
      />
    </div>
  );
}
