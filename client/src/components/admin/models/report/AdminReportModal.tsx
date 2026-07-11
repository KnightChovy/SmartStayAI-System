import { useEffect, useState } from 'react';
import { CheckCircle, CreditCard, Loader2, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminOverview, useAdminPayments } from '@/hooks/admin';
import { usePlatformAnalytics } from '@/hooks/analytics';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/utils/errorMessage';
import { exportToCsv } from '@/utils/exportCsv';
import { formatDateLong, formatTime } from '@/utils/formatDate';

interface AdminReportModalProps {
  currentTime: Date;
  onClose: () => void;
}

type ReportType = 'overview' | 'growth' | 'payments';

const reportTypes: Array<{ value: ReportType; icon: typeof TrendingUp; label: string }> = [
  { value: 'overview', icon: CheckCircle, label: 'Platform Overview' },
  { value: 'growth', icon: TrendingUp, label: 'User & Bookings Growth' },
  { value: 'payments', icon: CreditCard, label: 'Payments' },
];

export function AdminReportModal({ currentTime, onClose }: AdminReportModalProps) {
  const [reportType, setReportType] = useState<ReportType>('overview');
  const [isGenerating, setIsGenerating] = useState(false);

  const overview = useAdminOverview();
  const analytics = usePlatformAnalytics({ period: 'month', range: 12 });
  const payments = useAdminPayments({ limit: 100 });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isLoading =
    (reportType === 'overview' && overview.isLoading) ||
    (reportType === 'growth' && analytics.isLoading) ||
    (reportType === 'payments' && payments.isLoading);

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      if (reportType === 'overview') {
        const data = overview.data;
        if (!data) {
          toast.error(errorMessage(overview.error, 'Overview data is not available yet.'));
          return;
        }
        exportToCsv(
          `platform-overview-${Date.now()}`,
          [
            { header: 'Metric', value: row => row.label },
            { header: 'Value', value: row => row.value },
          ],
          [
            { label: 'Total users', value: data.users.total },
            { label: 'New users this month', value: data.users.newThisMonth },
            { label: 'Suspended users', value: data.users.suspended },
            { label: 'Total hotels', value: data.hotels.total },
            { label: 'Listed hotels', value: data.hotels.listed },
            { label: 'Total bookings', value: data.bookings.total },
            { label: 'Bookings this month', value: data.bookings.thisMonth },
            { label: 'GMV', value: data.revenue.gmv },
            { label: 'Commission pending', value: data.revenue.commissionPending },
            { label: 'Commission settled', value: data.revenue.commissionSettled },
          ]
        );
      } else if (reportType === 'growth') {
        const rows = analytics.data?.timeSeries ?? [];
        if (rows.length === 0) {
          toast.error('No growth data to export yet.');
          return;
        }
        exportToCsv(
          `user-bookings-growth-${Date.now()}`,
          [
            { header: 'Period', value: row => row.period },
            { header: 'Bookings', value: row => row.bookings },
            { header: 'Confirmed Bookings', value: row => row.confirmedBookings },
            { header: 'New Users', value: row => row.newUsers },
          ],
          rows
        );
      } else {
        const rows = payments.data?.results ?? [];
        if (rows.length === 0) {
          toast.error('No payments to export yet.');
          return;
        }
        exportToCsv(
          `payments-${Date.now()}`,
          [
            { header: 'Booking', value: row => row.bookingCode },
            { header: 'Customer', value: row => row.customer.fullName ?? row.customer.email },
            { header: 'Hotel', value: row => row.hotel.name },
            { header: 'Method', value: row => row.payment?.paymentMethod ?? 'unpaid' },
            { header: 'Amount', value: row => row.payment?.amount ?? row.totalAmount },
            { header: 'Status', value: row => row.payment?.status ?? 'unpaid' },
            { header: 'Created', value: row => row.payment?.createdAt ?? row.createdAt },
          ],
          rows
        );
      }
      toast.success('CSV report exported');
      onClose();
    } catch {
      toast.error('CSV export failed, please try again');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close report modal"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Generate Report</h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {formatDateLong(currentTime)} | {formatTime(currentTime)}
            </p>
          </div>
          <button
            aria-label="Close report modal"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Report Type
            </p>
            <div className="grid grid-cols-3 gap-3">
              {reportTypes.map(type => {
                const Icon = type.icon;

                return (
                  <button
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-[22px] border px-3 py-4 text-xs font-bold transition-colors',
                      reportType === type.value
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-outline-variant/40 bg-slate-50 text-slate-500 hover:bg-white'
                    )}
                    key={type.value}
                    onClick={() => setReportType(type.value)}
                    type="button"
                  >
                    <Icon className="size-5" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="rounded-2xl bg-slate-50 p-3 text-xs text-muted-foreground">
            Exports the data currently available for this platform as a CSV file. Growth covers
            the last 12 months; payments cover the latest 100 transactions.
          </p>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isGenerating || isLoading}
            onClick={handleGenerate}
            type="button"
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle className="size-4" />
            )}
            {isLoading ? 'Loading data...' : 'Generate CSV Report'}
          </button>
        </div>
      </section>
    </div>
  );
}
