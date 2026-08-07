import { useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_THEME } from '@/constants/roleTheme';
import { cn } from '@/lib/cn';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import {
  useAdminCommissions,
  useAdminOverview,
  useAdminPayments,
} from '@/hooks/admin';
import type { AdminPaymentsParams } from '@/types/admin.types';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';

function formatPaymentMethod(method: string): string {
  return method === 'vnpay'
    ? 'VNPay'
    : method.charAt(0).toUpperCase() + method.slice(1);
}

const paymentStatusOptions: Array<{
  label: string;
  value: NonNullable<AdminPaymentsParams['status']> | 'all';
}> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
];

export function AdminPaymentsPage() {
  const { data: overview } = useAdminOverview();
  const [paymentPage, setPaymentPage] = useState(1);
  const [commissionPage, setCommissionPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<
    NonNullable<AdminPaymentsParams['status']> | 'all'
  >('all');
  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    error: paymentsError,
    refetch: refetchPayments,
  } = useAdminPayments({
    limit: 10,
    page: paymentPage,
    status: paymentStatus === 'all' ? undefined : paymentStatus,
  });
  const {
    data: commissionsData,
    isLoading: isCommissionsLoading,
    isError: isCommissionsError,
    error: commissionsError,
  } = useAdminCommissions({ limit: 10, page: commissionPage });

  const paymentStats = [
    {
      icon: CreditCard,
      label: 'Platform GMV',
      value: formatCurrency(overview?.revenue.gmv),
    },
    {
      icon: CheckCircle2,
      label: 'Settled commission',
      value: formatCurrency(overview?.revenue.commissionSettled),
    },
    {
      icon: ShieldCheck,
      label: 'Pending commission',
      value: formatCurrency(overview?.revenue.commissionPending),
    },
  ];

  const paymentRows =
    paymentsData?.results.map(row => [
      row.bookingCode,
      row.customer.fullName ?? row.customer.email,
      row.hotel.name,
      row.payment ? formatPaymentMethod(row.payment.paymentMethod) : '—',
      formatCurrency(row.payment?.amount ?? row.totalAmount),
      row.payment ? row.payment.status.toUpperCase() : 'UNPAID',
      formatDateShort(row.payment?.createdAt ?? row.createdAt),
    ]) ?? [];

  const commissionRows =
    commissionsData?.results.map(commission => [
      commission.booking?.bookingCode ?? commission.id,
      commission.partner?.businessName ?? '—',
      formatCurrency(commission.commissionAmount),
      `${commission.commissionRate}%`,
      commission.status.toUpperCase(),
      formatDateShort(commission.createdAt),
    ]) ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={CreditCard}
        title="Payments"
        description="Monitor platform transactions, commissions, and payout status."
        actions={
          <Button
            className="rounded-lg bg-role-admin-primary px-4 text-white hover:bg-role-admin-secondary"
            onClick={() => void refetchPayments()}
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {paymentStats.map(item => {
          const Icon = item.icon;

          return (
            <div
              className="rounded-xl border border-slate-200 bg-white p-5"
              key={item.label}
            >
              {/* Ô icon cùng khuôn với AdminDashboardStatCard / KPI card của manager */}
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg',
                  ROLE_THEME.admin.accentSoft
                )}
              >
                <Icon className="size-4.5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{item.label}</p>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Recent Transactions
            </h2>
            <p className="text-xs text-muted-foreground">
              Every booking's payment status, including ones never paid.
            </p>
          </div>
          {/* shadcn Select như manager/partner, thay cho <select> thô (khác chiều cao + focus ring) */}
          <Select
            value={paymentStatus}
            onValueChange={value => {
              setPaymentPage(1);
              setPaymentStatus(
                value as NonNullable<AdminPaymentsParams['status']> | 'all'
              );
            }}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {paymentStatusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isPaymentsLoading && (
          <p className="text-sm text-muted-foreground">
            Loading transactions...
          </p>
        )}
        {isPaymentsError && (
          <p className="text-sm font-medium text-destructive">
            {errorMessage(paymentsError, 'Could not load transactions.')}
          </p>
        )}
        {!isPaymentsLoading && !isPaymentsError && (
          <AdminTable
            headers={[
              'Booking',
              'Customer',
              'Hotel',
              'Method',
              'Amount',
              'Status',
              'Created',
            ]}
            rows={paymentRows}
            footer={
              paymentsData && paymentsData.totalResults > 0 ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing{' '}
                    <span className="font-semibold text-slate-700">
                      {(paymentsData.page - 1) * paymentsData.limit + 1}–
                      {Math.min(
                        paymentsData.page * paymentsData.limit,
                        paymentsData.totalResults
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-700">
                      {paymentsData.totalResults}
                    </span>{' '}
                    transactions
                  </p>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Button
                      className="h-9 rounded-xl px-3"
                      disabled={paymentsData.page <= 1}
                      onClick={() =>
                        setPaymentPage(current => Math.max(1, current - 1))
                      }
                      type="button"
                      variant="outline"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <span className="min-w-20 text-center text-sm font-medium text-slate-600">
                      {paymentsData.page} /{' '}
                      {Math.max(paymentsData.totalPages, 1)}
                    </span>
                    <Button
                      className="h-9 rounded-xl px-3"
                      disabled={paymentsData.page >= paymentsData.totalPages}
                      onClick={() =>
                        setPaymentPage(current =>
                          Math.min(paymentsData.totalPages, current + 1)
                        )
                      }
                      type="button"
                      variant="outline"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : undefined
            }
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-950">Commission Settlement</h2>
        {/* Nói rõ đây là bảng CHỈ XEM: tất toán từng khoản giờ do cron chạy tự động sau khi
            khách trả phòng và qua kỳ giữ tiền — endpoint duyệt tay từng khoản đã bị gỡ, điểm
            duyệt tay duy nhất còn lại là Payouts. Không ghi ra thì người dùng đi tìm nút. */}
        <p className="-mt-1 text-sm text-slate-500">
          Read-only. Commissions settle automatically once the stay is closed and
          the hold period passes; the only manual approval left is a hotel payout.
        </p>
        {isCommissionsLoading && (
          <p className="text-sm text-muted-foreground">
            Loading commissions...
          </p>
        )}
        {isCommissionsError && (
          <p className="text-sm font-medium text-destructive">
            {errorMessage(commissionsError, 'Could not load commissions.')}
          </p>
        )}
        {!isCommissionsLoading && !isCommissionsError && (
          <AdminTable
            headers={[
              'Booking',
              'Partner',
              'Commission',
              'Rate',
              'Status',
              'Created',
            ]}
            rows={commissionRows}
            footer={
              commissionsData && commissionsData.totalResults > 0 ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing{' '}
                    <span className="font-semibold text-slate-700">
                      {(commissionsData.page - 1) * commissionsData.limit + 1}–
                      {Math.min(
                        commissionsData.page * commissionsData.limit,
                        commissionsData.totalResults
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-700">
                      {commissionsData.totalResults}
                    </span>{' '}
                    commissions
                  </p>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Button
                      className="h-9 rounded-xl px-3"
                      disabled={commissionsData.page <= 1}
                      onClick={() =>
                        setCommissionPage(current => Math.max(1, current - 1))
                      }
                      type="button"
                      variant="outline"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <span className="min-w-20 text-center text-sm font-medium text-slate-600">
                      {commissionsData.page} /{' '}
                      {Math.max(commissionsData.totalPages, 1)}
                    </span>
                    <Button
                      className="h-9 rounded-xl px-3"
                      disabled={
                        commissionsData.page >= commissionsData.totalPages
                      }
                      onClick={() =>
                        setCommissionPage(current =>
                          Math.min(commissionsData.totalPages, current + 1)
                        )
                      }
                      type="button"
                      variant="outline"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  );
}
