import { useState } from 'react';
import { CheckCircle2, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import {
  useAdminCommissions,
  useAdminOverview,
  useAdminPayments,
  useSettleAdminCommission,
} from '@/hooks/admin';
import type { AdminPaymentsParams } from '@/types/admin.types';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';

function formatPaymentMethod(method: string): string {
  return method === 'vnpay' ? 'VNPay' : method.charAt(0).toUpperCase() + method.slice(1);
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
    limit: 20,
    status: paymentStatus === 'all' ? undefined : paymentStatus,
  });
  const {
    data: commissionsData,
    isLoading: isCommissionsLoading,
    isError: isCommissionsError,
    error: commissionsError,
  } = useAdminCommissions({ limit: 20 });
  const settleCommission = useSettleAdminCommission();

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
      commission.id,
    ]) ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        description="Monitor platform transactions, commissions, and payout status."
        actions={
          <Button
            className="h-12 rounded-full bg-black px-6 text-white"
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
            <div className="rounded-2xl border bg-white p-5" key={item.label}>
              <Icon className="size-5 text-blue-600" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold text-slate-950">{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Recent Transactions</h2>
            <p className="text-xs text-muted-foreground">
              Every booking's payment status, including ones never paid.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-payment-status-filter">Status</Label>
            <select
              className="h-9 w-44 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              id="admin-payment-status-filter"
              onChange={event =>
                setPaymentStatus(
                  event.target.value as NonNullable<AdminPaymentsParams['status']> | 'all'
                )
              }
              value={paymentStatus}
            >
              {paymentStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {isPaymentsLoading && (
          <p className="text-sm text-muted-foreground">Loading transactions...</p>
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
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-950">Commission Settlement</h2>
        {isCommissionsLoading && (
          <p className="text-sm text-muted-foreground">Loading commissions...</p>
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
              'Actions',
            ]}
            rows={commissionRows}
            renderLastColumn={row => (
              <Button
                className="h-8 rounded-full px-3 text-xs"
                disabled={row[4] === 'SETTLED' || settleCommission.isPending}
                variant="outline"
                onClick={() => settleCommission.mutate(row[6])}
              >
                {row[4] === 'SETTLED' ? 'Settled' : 'Settle'}
              </Button>
            )}
          />
        )}
        {settleCommission.isError && (
          <p className="text-sm font-medium text-destructive">
            {errorMessage(settleCommission.error, 'Could not settle commission.')}
          </p>
        )}
      </section>
    </div>
  );
}
