import { DollarSign } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';
import { AdminRevenueChart } from '@/components/admin/revenue/AdminRevenueChart';
import { AdminRevenueFilters } from '@/components/admin/revenue/AdminRevenueFilters';
import { AdminRevenueKpiCards } from '@/components/admin/revenue/AdminRevenueKpiCards';
import { useAdminRevenue } from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { exportToCsv } from '@/utils/exportCsv';
import { toDateInputValue } from '@/utils/formatDate';
import type { AdminRevenueParams } from '@/types/admin.types';

function defaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toDateInputValue(from), to: toDateInputValue(now) };
}

export function AdminRevenuePage() {
  const [range, setRange] = useState(defaultRange);
  const [groupBy, setGroupBy] =
    useState<NonNullable<AdminRevenueParams['groupBy']>>('day');
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError, error } = useAdminRevenue({
    from: range.from,
    to: range.to,
    groupBy,
  });

  const handleExport = () => {
    const series = data?.series ?? [];
    if (series.length === 0) {
      toast.error('No data to export yet');
      return;
    }

    setIsExporting(true);
    try {
      exportToCsv(
        `platform-revenue-${range.from}-to-${range.to}`,
        [
          { header: 'Period', value: row => row.period },
          { header: 'GMV', value: row => row.gmv },
          { header: 'Commission', value: row => row.commission },
          {
            header: 'Net Platform Revenue',
            value: row => row.netPlatformRevenue,
          },
          { header: 'Bookings', value: row => row.bookingCount },
        ],
        series
      );
      toast.success('CSV report exported');
    } catch {
      toast.error('CSV export failed, please try again');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={DollarSign}
        description="Platform GMV, commission, and net revenue across all listed hotels"
        title="Revenue"
      />

      {isError && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage(error, 'Could not load platform revenue.')}
        </p>
      )}

      <AdminRevenueFilters
        from={range.from}
        groupBy={groupBy}
        isExporting={isExporting}
        onExport={handleExport}
        onFromChange={value => setRange(prev => ({ ...prev, from: value }))}
        onGroupByChange={setGroupBy}
        onToChange={value => setRange(prev => ({ ...prev, to: value }))}
        to={range.to}
      />

      <AdminRevenueKpiCards data={data} isLoading={isLoading} />

      <AdminRevenueChart series={data?.series ?? []} isLoading={isLoading} />
    </div>
  );
}
