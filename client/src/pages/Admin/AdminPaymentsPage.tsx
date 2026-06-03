import { CheckCircle2, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPageHeader } from '@/components/Admin/shared/AdminPageHeader';
import { AdminTable } from '@/components/Admin/shared/AdminTable';

const transactions = [
  ['TXN-10021', 'Sarah Nguyen', '$420.00', 'Visa ending 4242', 'Verified'],
  ['TXN-10022', 'Marcus Lee', '$1,250.00', 'Stripe Wallet', 'Pending'],
  ['TXN-10023', 'Elena Kovac', '$850.00', 'Mastercard ending 1188', 'Failed'],
  ['TXN-10024', 'Hiroshi Tan', '$290.00', 'Bank transfer', 'Verified'],
];

const paymentStats = [
  { icon: CreditCard, label: 'Processed today', value: '$48.2k' },
  { icon: CheckCircle2, label: 'Verified payments', value: '96.8%' },
  { icon: ShieldCheck, label: 'Risk holds', value: '12' },
];

export function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        description="Manage payment configurations, transaction logs, and verification statuses."
        actions={
          <Button className="h-12 rounded-full bg-black px-6 text-white">
            <RefreshCw className="mr-2 size-4" />
            Sync Gateway
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
          headers={['Transaction', 'Customer', 'Amount', 'Method', 'Status']}
          rows={transactions}
          renderLastColumn={row => (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
              {row[4]}
            </span>
          )}
        />
      </section>
    </div>
  );
}
