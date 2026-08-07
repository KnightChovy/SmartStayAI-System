import { useTranslation } from 'react-i18next';
import { CalendarCheck, Ban, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CancellationRule } from '@/types/hotel.types';

interface CancellationLineProps {
  /**
   * Chính sách huỷ của khách sạn (`hotel.cancellationRule`). `null`/`undefined` = khách sạn chưa
   * khai ⇒ không hiển thị gì (không đoán thay khách sạn).
   */
  rule: CancellationRule | null | undefined;
  className?: string;
}

/**
 * Dòng chính sách huỷ nổi bật trong booking card (SS-302).
 *
 * ⚠️ **Không đọc mỗi `freeUntilHours`**: chính sách giờ là **bậc thang** nhiều mức %, và
 * `freeUntilHours = null` chỉ có nghĩa "không có bậc nào hoàn 100%" — chứ **không** phải "không
 * hoàn đồng nào". Đọc thẳng `tiers` mới ra được câu đúng, nếu không sẽ nói với khách là mất trắng
 * trong khi thực tế họ vẫn được hoàn 50%.
 *
 * Ba câu có thể nói:
 * - có bậc 100% → "Huỷ miễn phí trước N giờ/ngày" (xanh)
 * - bậc cao nhất > 0% → "Hoàn tới X% nếu huỷ sớm" (xanh nhạt)
 * - mọi bậc = 0% → "Không hoàn tiền" (xám)
 */
export default function CancellationLine({ rule, className }: CancellationLineProps) {
  const { t } = useTranslation('hotel');
  if (!rule || rule.tiers.length === 0) return null;

  const best = Math.max(...rule.tiers.map(tier => tier.refundPercent));

  // Có bậc 100% ⇒ câu quen thuộc nhất với khách: "huỷ miễn phí trước N".
  if (rule.freeUntilHours != null && best === 100) {
    const hours = rule.freeUntilHours;
    return (
      <p
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium text-emerald-700',
          className
        )}
      >
        <CalendarCheck className="size-4 shrink-0" aria-hidden="true" />
        {hours % 24 === 0 && hours > 0
          ? t('room.freeCancellationDays', { count: hours / 24 })
          : t('room.freeCancellation', { hours })}
      </p>
    );
  }

  // Không hoàn 100% nhưng vẫn hoàn một phần — nói ra, đừng gộp vào "không hoàn tiền".
  if (best > 0) {
    const earliest = rule.tiers.find(tier => tier.refundPercent === best);
    return (
      <p
        className={cn('flex items-center gap-1.5 text-sm font-medium text-emerald-700', className)}
      >
        <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
        {t('room.partialRefund', { percent: best, hours: earliest?.minHoursBefore ?? 0 })}
      </p>
    );
  }

  return (
    <p
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium text-on-surface-variant',
        className
      )}
    >
      <Ban className="size-4 shrink-0" aria-hidden="true" />
      {t('room.nonRefundable')}
    </p>
  );
}
