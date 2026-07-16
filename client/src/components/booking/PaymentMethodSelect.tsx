import { QrCode, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

/**
 * Cổng thanh toán online mà khách được chọn. BE còn nhận `cash` (lễ tân thu tiền mặt tại quầy
 * qua `record-cash-payment`) và enum `stripe`, nhưng cả hai đều KHÔNG mời ở luồng đặt phòng:
 * stripe không có route, còn cash là quyết định sản phẩm — chỉ giữ VNPay + SePay.
 */
export type PaymentMethod = 'vnpay' | 'sepay';

const METHODS = [
  { value: 'vnpay', icon: Wallet, labelKey: 'methods.vnpay.label', descKey: 'methods.vnpay.desc' },
  { value: 'sepay', icon: QrCode, labelKey: 'methods.sepay.label', descKey: 'methods.sepay.desc' },
] as const satisfies {
  value: PaymentMethod;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
}[];

/** Chọn phương thức thanh toán online (VNPay redirect / SePay QR). */
export default function PaymentMethodSelect({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}) {
  const { t } = useTranslation('booking');
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {METHODS.map(({ value: v, icon: Icon, labelKey, descKey }) => {
        const label = t(labelKey);
        const desc = t(descKey);
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
