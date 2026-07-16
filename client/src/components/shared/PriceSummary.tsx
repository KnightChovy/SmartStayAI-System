import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useMoney } from '@/hooks/currency';

export interface PriceLine {
  label: string;
  /** Giá trị tiền (string Decimal hoặc number). Bỏ qua nếu có `valueText`. */
  value?: string | number;
  /**
   * Text thay cho số tiền — dùng cho dòng không có con số cụ thể,
   * vd "Thuế & phí: Đã bao gồm" (BE gộp thuế vào tổng, không tách riêng).
   */
  valueText?: string;
  /** Dòng giảm giá → hiển thị màu xanh + dấu trừ. */
  negative?: boolean;
  muted?: boolean;
}

interface PriceSummaryProps {
  lines: PriceLine[];
  total: string | number;
  totalLabel?: string;
  className?: string;
}

/**
 * Bảng tính tiền dùng chung (checkout + booking detail).
 * Tiền hiển thị qua `useMoney` nên tự đổi theo currency switcher (base vẫn là VND).
 */
export default function PriceSummary({
  lines,
  total,
  totalLabel,
  className,
}: PriceSummaryProps) {
  const { t } = useTranslation('common');
  const { format } = useMoney();
  const label = totalLabel ?? t('total');

  return (
    <div className={cn('space-y-2.5', className)}>
      {lines.map((line, i) => (
        <div key={i} className="flex items-center justify-between gap-3 text-sm">
          <span className={cn('text-on-surface-variant', line.muted && 'text-on-surface-variant/70')}>
            {line.label}
          </span>
          <span
            className={cn(
              'shrink-0 font-medium text-on-surface',
              line.negative && 'text-emerald-600'
            )}
          >
            {line.valueText ?? (
              <>
                {line.negative ? '−' : ''}
                {format(line.value ?? 0)}
              </>
            )}
          </span>
        </div>
      ))}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-3">
        <span className="font-be-vietnam font-semibold text-on-surface">{label}</span>
        <span className="font-be-vietnam text-lg font-bold text-on-surface">{format(total)}</span>
      </div>
    </div>
  );
}
