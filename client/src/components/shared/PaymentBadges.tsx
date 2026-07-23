import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PaymentBadgesProps {
  className?: string;
}

// Các cổng thanh toán sàn hỗ trợ (khớp luồng thật: VNPAY redirect + SePay QR).
// Dùng nhãn chữ tự dựng thay vì logo ảnh ngoài để component self-contained, không lệ thuộc asset.
const METHODS = ['VNPAY', 'SePay', 'Visa', 'Mastercard'];

/**
 * Dải badge thanh toán + bảo mật SSL (SS-004 / SS-703). Tái dùng ở footer và trang booking.
 */
export default function PaymentBadges({ className }: PaymentBadgesProps) {
  const { t } = useTranslation('common');

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-3', className)}>
      {METHODS.map(method => (
        <span
          key={method}
          className="rounded-lg border border-outline-variant/40 bg-white px-3 py-1.5 text-xs font-bold tracking-wide text-on-surface shadow-sm"
        >
          {method}
        </span>
      ))}
      <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <Lock className="size-3.5" aria-hidden="true" /> {t('trust.sslSecured')}
      </span>
    </div>
  );
}
