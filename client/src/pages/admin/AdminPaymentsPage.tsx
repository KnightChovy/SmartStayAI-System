import { CheckCircle2, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import {
  useAdminCommissions,
  useAdminOverview,
  useSettleAdminCommission,
} from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';

export function AdminPaymentsPage() {
  const { data: overview } = useAdminOverview();
  const { data, isLoading, isError, error, refetch } = useAdminCommissions({
    limit: 20,
  });
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

  const rows =
    data?.results.map(commission => [
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
        description="Manage platform commissions, payout status, and settlement workflow."
        actions={
          <Button
            className="h-12 rounded-full bg-black px-6 text-white"
            onClick={() => void refetch()}
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

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Payment Configuration</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gateway">Primary gateway</Label>
              <Input id="gateway" defaultValue="Stripe Connect" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settlement">Settlement currency</Label>
              <Input id="settlement" defaultValue="USD" />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input className="size-4 accent-blue-600" defaultChecked type="checkbox" />
              Auto verify low-risk transactions
            </label>
          </div>
        </div>

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
          rows={rows}
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
      </section>
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading commissions...</p>
      )}
      {isError && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage(error, 'Could not load commissions.')}
        </p>
      )}
      {settleCommission.isError && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage(settleCommission.error, 'Could not settle commission.')}
        </p>
      )}
    </div>
  );
}
