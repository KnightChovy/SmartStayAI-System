import { useTranslation } from 'react-i18next';
import { CalendarCheck, Headphones, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TrustBarProps {
  className?: string;
}

/**
 * Dải tín hiệu tin cậy (SS-004 / SS-703): Hủy miễn phí · Không phí ẩn · Hỗ trợ 24/7.
 * Static + i18n, tái dùng ở landing / footer / trang booking.
 */
export default function TrustBar({ className }: TrustBarProps) {
  const { t } = useTranslation('common');
  const items = [
    { icon: CalendarCheck, label: t('trust.freeCancellation') },
    { icon: ShieldCheck, label: t('trust.noHiddenFees') },
    { icon: Headphones, label: t('trust.support247') },
  ];

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-on-surface-variant',
        className
      )}
    >
      {items.map(({ icon: Icon, label }) => (
        <span key={label} className="flex items-center gap-2">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}
