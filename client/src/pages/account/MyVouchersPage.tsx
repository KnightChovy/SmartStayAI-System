import { useState } from 'react';
import { Check, Copy, Ticket } from 'lucide-react';
import { useAvailablePromotions } from '@/hooks/account';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import type { PromotionItem } from '@/types/account.types';

function discountLabel(p: PromotionItem): string {
  if (p.discountType === 'percentage') return `${p.discountValue}% off`;
  if (p.discountType === 'fixed_amount') return `${formatCurrency(p.discountValue)} off`;
  return `${p.discountValue} free night`;
}

export default function MyVouchersPage() {
  const { data, isLoading } = useAvailablePromotions();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div>
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">Vouchers &amp; offers</h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Apply a code at checkout to redeem your discount.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
        ) : !data || data.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState icon={Ticket} title="No vouchers" description="Check back later for new offers." />
          </div>
        ) : (
          data.map(p => (
            <div
              key={p.id}
              className="relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface p-5"
            >
              <div className="absolute -right-6 -top-6 size-20 rounded-full bg-primary/5" />
              <div className="flex items-center gap-2 text-primary">
                <Ticket className="size-5" />
                <span className="font-be-vietnam text-lg font-bold">{discountLabel(p)}</span>
              </div>
              <h3 className="mt-2 font-semibold text-on-surface">{p.name}</h3>
              {p.description && <p className="mt-1 text-sm text-on-surface-variant">{p.description}</p>}
              <div className="mt-2 text-xs text-on-surface-variant">
                {p.minNights ? `Min ${p.minNights} nights · ` : ''}
                Valid until {formatDateShort(p.endDate)}
              </div>

              <button
                onClick={() => copy(p.code)}
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <span className="font-mono tracking-wider">{p.code}</span>
                {copied === p.code ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Check className="size-4" /> Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Copy className="size-4" /> Copy
                  </span>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
