import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useMoney } from '@/hooks/currency';

export interface PriceLine {
  label: string;
  /** Giá trị tiền (string Decimal hoặc number). */
  value: string | number;
  /** Dòng giảm giá → hiển thị màu xanh + dấu trừ. */
  negative?: boolean;
  muted?: boolean;
}

/**
 * Khối nằm SAU dòng tổng: các khoản đã trả / khấu trừ (vd trừ ví) + số khách còn phải trả.
 * Tách khỏi `lines` một cách có chủ đích — mấy khoản này KHÔNG cấu thành giá đơn, chúng nói
 * tiền lấy từ đâu; nhét lẫn lên trên dòng tổng sẽ khiến "Tổng cộng" không còn là giá của đơn.
 */
export interface PriceSummaryFooter {
  lines: PriceLine[];
  label: string;
  total: string | number;
}

interface PriceSummaryProps {
  lines: PriceLine[];
  total: string | number;
  totalLabel?: string;
  footer?: PriceSummaryFooter;
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
  footer,
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
            {line.negative ? '−' : ''}
            {format(line.value)}
          </span>
        </div>
      ))}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-3">
        <span className="font-be-vietnam font-semibold text-on-surface">{label}</span>
        {/* Có footer thì "còn phải trả" mới là con số khách quan tâm ⇒ hạ nhấn mạnh của dòng
            tổng xuống, tránh hai số cùng cỡ chữ tranh nhau. */}
        <span
          className={cn(
            'font-be-vietnam text-on-surface',
            footer ? 'font-semibold' : 'text-lg font-bold'
          )}
        >
          {format(total)}
        </span>
      </div>

      {footer && (
        <div className="space-y-2.5 pt-1">
          {footer.lines.map((line, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-on-surface-variant">{line.label}</span>
              <span
                className={cn(
                  'shrink-0 font-medium text-on-surface',
                  line.negative && 'text-emerald-600'
                )}
              >
                {line.negative ? '−' : ''}
                {format(line.value)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-3">
            <span className="font-be-vietnam font-semibold text-on-surface">{footer.label}</span>
            <span className="font-be-vietnam text-lg font-bold text-on-surface">
              {format(footer.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
