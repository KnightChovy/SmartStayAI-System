import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';

export interface PriceLine {
  label: string;
  /** Giá trị tiền (string Decimal hoặc number). */
  value: string | number;
  /** Dòng giảm giá → hiển thị màu xanh + dấu trừ. */
  negative?: boolean;
  muted?: boolean;
}

interface PriceSummaryProps {
  lines: PriceLine[];
  total: string | number;
  totalLabel?: string;
  currency?: 'VND' | 'USD';
  className?: string;
}

/** Bảng tính tiền dùng chung (checkout + booking detail). */
export default function PriceSummary({
  lines,
  total,
  totalLabel,
  currency = 'VND',
  className,
}: PriceSummaryProps) {
  const { t } = useTranslation('common');
  const label = totalLabel ?? t('total');
  return (
    <div className={cn('space-y-2.5', className)}>
      {lines.map((line, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className={cn('text-on-surface-variant', line.muted && 'text-on-surface-variant/70')}>
            {line.label}
          </span>
          <span
            className={cn(
              'font-medium text-on-surface',
              line.negative && 'text-emerald-600'
            )}
          >
            {line.negative ? '−' : ''}
            {formatCurrency(line.value, currency)}
          </span>
        </div>
      ))}

      <div className="mt-3 flex items-center justify-between border-t border-outline-variant/30 pt-3">
        <span className="font-be-vietnam font-semibold text-on-surface">{label}</span>
        <span className="font-be-vietnam text-lg font-bold text-on-surface">
          {formatCurrency(total, currency)}
        </span>
      </div>
    </div>
  );
}
