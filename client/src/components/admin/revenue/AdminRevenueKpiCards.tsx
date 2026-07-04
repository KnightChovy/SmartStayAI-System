import { formatCurrency } from '@/utils/formatCurrency';
import type { AdminPlatformRevenue } from '@/types/admin.types';
import { ChangeBadge } from './ChangeBadge';

interface AdminRevenueKpiCardsProps {
  data: AdminPlatformRevenue | undefined;
  isLoading: boolean;
}

export function AdminRevenueKpiCards({ data, isLoading }: AdminRevenueKpiCardsProps) {
  const summary = data?.summary;
  const change = data?.comparison?.change ?? null;

  const cards = [
    {
      label: 'Gross Merchandise Value',
      value: isLoading ? '—' : formatCurrency(summary?.gmv),
      change: change?.gmvPct ?? null,
    },
    {
      label: 'Net Platform Revenue',
      value: isLoading ? '—' : formatCurrency(summary?.netPlatformRevenue),
      change: change?.netRevenuePct ?? null,
    },
    {
      label: 'Commission Settled',
      value: isLoading ? '—' : formatCurrency(summary?.commissionSettled),
      change: null,
    },
    {
      label: 'Commission Pending',
      value: isLoading ? '—' : formatCurrency(summary?.commissionPending),
      change: null,
    },
    {
      label: 'Refunded',
      value: isLoading ? '—' : formatCurrency(summary?.refunded),
      change: null,
    },
    {
      label: 'Bookings',
      value: isLoading ? '—' : (summary?.bookingCount ?? 0).toLocaleString('en-US'),
      change: null,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(card => (
        <div className="rounded-2xl border bg-white p-4 sm:p-5 lg:p-6" key={card.label}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            {card.change !== null && <ChangeBadge value={card.change} />}
          </div>
          <p className="mt-3 text-2xl font-semibold sm:text-3xl">{card.value}</p>
        </div>
      ))}
    </section>
  );
}
