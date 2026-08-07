import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { useCancellationPresets } from '@/hooks/hotels';
import { cn } from '@/lib/cn';
import CancellationLine from '@/components/shared/CancellationLine';
import type { CancellationTier } from '@/types/booking.types';
import type { CancellationRule } from '@/types/hotel.types';

interface HotelCancellationPolicyProps {
  /** `hotel.cancellationRule` — `null`/rỗng = khách sạn chưa khai ⇒ không vẽ gì, không đoán thay. */
  rule: CancellationRule | null | undefined;
  /** Ngày nhận phòng đang chọn (YYYY-MM-DD) — có thì quy được mốc giờ ra một NGÀY cụ thể. */
  checkIn?: string | null;
  className?: string;
}

/**
 * Gộp các bậc liền nhau CÙNG mức hoàn về một dòng.
 *
 * Bậc thang của BE có thể có hai mốc cùng 100% (vd 720h và 360h) — về nghĩa thì mốc nhỏ hơn đã
 * bao trọn mốc lớn hơn, nên in ra hai dòng "hoàn 100%" chỉ khiến người đọc tưởng mình bỏ sót
 * khác biệt nào đó. Giữ mốc NHỎ NHẤT của mỗi mức (mốc rộng lượng nhất với khách).
 */
function collapseTiers(tiers: CancellationTier[]): CancellationTier[] {
  const sorted = [...tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
  const out: CancellationTier[] = [];
  for (const tier of sorted) {
    const last = out[out.length - 1];
    if (last && last.refundPercent === tier.refundPercent) {
      out[out.length - 1] = tier;
    } else {
      out.push(tier);
    }
  }
  return out;
}

/**
 * Hai thang có giống nhau không — so TỪNG FIELD, tuyệt đối không `JSON.stringify`.
 * Prisma round-trip JSON đảo thứ tự khoá (`{refundPercent, minHoursBefore}` thay vì ngược lại),
 * nên so chuỗi sẽ báo "khác nhau" trên hai thang y hệt và preset đang dùng không bao giờ khớp.
 */
function sameTiers(a: CancellationTier[], b: CancellationTier[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (tier, i) =>
      tier.minHoursBefore === b[i]?.minHoursBefore && tier.refundPercent === b[i]?.refundPercent
  );
}

/**
 * Chính sách huỷ của khách sạn, bày ở ĐẦU trang chi tiết.
 *
 * Đây là thứ quyết định khách mất bao nhiêu tiền nếu đổi ý — đắt hơn mọi tiện nghi bên dưới — nên
 * nó không nên nằm lẫn trong danh sách chính sách chung ở giữa trang.
 *
 * Tên preset lấy từ `GET /hotels/cancellation-presets`: BE dùng đúng bộ đó làm mặc định và làm
 * lựa chọn cho đối tác, nên khớp được thang của khách sạn với một preset là gọi tên được chính
 * sách ("Vừa phải") thay vì bắt khách tự đọc một bảng số. Không khớp preset nào (đối tác tự soạn)
 * thì bảng bậc thang vẫn đủ nghĩa — chỉ thiếu cái tên.
 */
export default function HotelCancellationPolicy({
  rule,
  checkIn,
  className,
}: HotelCancellationPolicyProps) {
  const { t } = useTranslation('hotel');
  // Dữ liệu tham chiếu tĩnh, `staleTime: Infinity` ⇒ mọi trang dùng chung một lần tải.
  const { data: presets } = useCancellationPresets();
  // `Date.now()` gọi thẳng trong render là hàm không thuần (lint `react-hooks/purity` chặn, và
  // đúng: mỗi lần re-render ra một giá trị khác). Chốt một mốc lúc mount là đủ — hạn huỷ tính
  // bằng ngày, không cần đồng hồ chạy.
  const [mountedAt] = useState(() => Date.now());

  if (!rule || rule.tiers.length === 0) return null;

  const rows = collapseTiers(rule.tiers);
  const preset = presets?.find(
    p =>
      sameTiers(collapseTiers(p.tiers), rows) &&
      p.noShowRefundPercent === rule.noShowRefundPercent
  );

  /** Mốc giờ → chữ: chia hết cho 24 thì nói bằng NGÀY (khách nghĩ theo ngày, không theo giờ). */
  const whenLabel = (hours: number) =>
    hours % 24 === 0
      ? t('cancellation.beforeDays', { count: hours / 24 })
      : t('cancellation.beforeHours', { hours });

  // Hạn huỷ miễn phí quy về NGÀY THẬT — chỉ làm được khi khách đã chọn ngày nhận phòng.
  let freeUntilDate: string | null = null;
  if (checkIn && rule.freeUntilHours != null) {
    const checkInAt = new Date(`${checkIn}T00:00:00`);
    if (!Number.isNaN(checkInAt.getTime())) {
      const deadline = new Date(checkInAt.getTime() - rule.freeUntilHours * 3600_000);
      // Hạn đã trôi qua (kỳ ở quá gần) thì KHÔNG nói — hứa "huỷ miễn phí tới hết <ngày hôm qua>"
      // còn tệ hơn im lặng; bảng bậc thang bên dưới vẫn nói đúng mức hoàn.
      if (deadline.getTime() > mountedAt) {
        freeUntilDate = deadline.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    }
  }

  return (
    <section
      id="cancellation"
      className={cn(
        'mt-6 scroll-mt-[var(--app-anchor-offset,7rem)] rounded-2xl border border-outline-variant/40 bg-surface p-5',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 className="flex items-center gap-2 font-be-vietnam text-xl font-bold text-on-surface">
          <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
          {t('cancellation.title')}
        </h2>
        {preset && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-on-surface">
            {preset.name}
          </span>
        )}
      </div>

      {/* Câu tóm tắt dùng CHUNG component với thẻ phòng bên dưới — hai chỗ không thể nói lệch nhau. */}
      <CancellationLine rule={rule} className="mt-2" />

      {freeUntilDate && (
        <p className="mt-1 text-sm text-on-surface-variant">
          {t('cancellation.freeUntilDate', { date: freeUntilDate })}
        </p>
      )}

      <ul className="mt-4 divide-y divide-outline-variant/30 border-t border-outline-variant/30">
        {rows.map(tier => (
          <li
            key={tier.minHoursBefore}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="text-on-surface-variant">
              {tier.minHoursBefore > 0 ? whenLabel(tier.minHoursBefore) : t('cancellation.later')}
            </span>
            <span
              className={cn(
                'shrink-0 font-semibold tabular-nums',
                tier.refundPercent > 0 ? 'text-emerald-700' : 'text-on-surface-variant'
              )}
            >
              {t('cancellation.refundPercent', { percent: tier.refundPercent })}
            </span>
          </li>
        ))}
        {/* No-show là ca RIÊNG (không huỷ, chỉ không tới) nên BE để một field riêng — không nhét
            vào bậc thang, nếu không khách sẽ tưởng đến muộn cũng được hoàn như huỷ sát giờ. */}
        <li className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="text-on-surface-variant">{t('cancellation.noShow')}</span>
          <span
            className={cn(
              'shrink-0 font-semibold tabular-nums',
              rule.noShowRefundPercent > 0 ? 'text-emerald-700' : 'text-on-surface-variant'
            )}
          >
            {t('cancellation.refundPercent', { percent: rule.noShowRefundPercent })}
          </span>
        </li>
      </ul>

      {/* BE đóng băng chính sách vào booking lúc đặt ⇒ nói rõ để khách đã đặt không hoang mang khi
          khách sạn đổi chính sách sau đó. */}
      <p className="mt-3 text-xs text-on-surface-variant">{t('cancellation.snapshotNote')}</p>
    </section>
  );
}
