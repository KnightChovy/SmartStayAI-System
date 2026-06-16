import { Banknote, CreditCard, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PaymentMethod = 'vnpay' | 'sepay' | 'stripe' | 'cash';

const METHODS: { value: PaymentMethod; label: string; desc: string; icon: LucideIcon }[] = [
  { value: 'vnpay', label: 'VNPAY', desc: 'Pay via VNPAY QR / bank app', icon: Wallet },
  { value: 'sepay', label: 'SePay', desc: 'Bank transfer with auto-confirm', icon: Banknote },
  { value: 'stripe', label: 'Credit / Debit card', desc: 'Visa, Mastercard, JCB', icon: CreditCard },
  { value: 'cash', label: 'Pay at property', desc: 'Cash on check-in', icon: Banknote },
];

/** Chọn phương thức thanh toán (UI mock — chưa nối cổng thật). */
export default function PaymentMethodSelect({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {METHODS.map(({ value: v, label, desc, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-4 text-left transition-all',
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-outline-variant/40 hover:border-primary/40'
            )}
          >
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-xl',
                active ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
              )}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">{label}</p>
              <p className="text-xs text-on-surface-variant">{desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
