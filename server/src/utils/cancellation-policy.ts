// Engine chính sách huỷ BẬC THANG — HÀM THUẦN, KHÔNG chạm DB/thời gian hệ thống (mọi input truyền vào),
// nên unit-test được 100%. `import type` để file build ra KHÔNG kéo runtime @prisma/client (test require thẳng).
import type { Prisma } from '@prisma/client';

/**
 * Mỗi bậc: huỷ TRƯỚC ít nhất `minHoursBefore` giờ (tính tới thời điểm nhận phòng) ⇒ hoàn `refundPercent%`.
 * `tiers` sắp GIẢM DẦN theo minHoursBefore và luôn có bậc `minHoursBefore: 0` (phủ kín tới sát check-in).
 */
export interface CancellationTier {
  minHoursBefore: number;
  refundPercent: number;
}
export interface CancellationPolicy {
  tiers: CancellationTier[];
  noShowRefundPercent: number;
}

const T = (minHoursBefore: number, refundPercent: number): CancellationTier => ({ minHoursBefore, refundPercent });

/** 5 preset để đối tác chọn nhanh (và làm nguồn cho GET /hotels/cancellation-presets). */
export const CANCELLATION_PRESETS = {
  flexible: { name: 'Linh hoạt', policy: { tiers: [T(24, 100), T(0, 0)], noShowRefundPercent: 0 } },
  moderate: {
    name: 'Vừa phải',
    policy: { tiers: [T(720, 100), T(360, 100), T(168, 50), T(72, 30), T(0, 0)], noShowRefundPercent: 0 },
  },
  firm: { name: 'Chặt', policy: { tiers: [T(720, 100), T(168, 50), T(0, 0)], noShowRefundPercent: 0 } },
  strict: { name: 'Rất chặt', policy: { tiers: [T(720, 100), T(336, 50), T(0, 0)], noShowRefundPercent: 0 } },
  non_refundable: { name: 'Không hoàn', policy: { tiers: [T(0, 0)], noShowRefundPercent: 0 } },
} as const satisfies Record<string, { name: string; policy: CancellationPolicy }>;

// KS chưa cấu hình ⇒ áp Moderate (bộ số khuyến nghị cho thị trường VN)
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = CANCELLATION_PRESETS.moderate.policy;

/**
 * Chuẩn hoá một giá trị JSON thành CancellationPolicy hợp lệ. Nhận CẢ format mới (tiers) lẫn format
 * cũ ({freeUntilHours, latePenalty}) để tương thích ngược — KHÔNG cần migrate data:
 * - có `tiers` ⇒ dùng (sắp giảm dần cho chắc).
 * - format cũ 'full' ⇒ quy về [{freeUntilHours,100},{0,0}] (giữ đúng hành vi mất-hết-sau-hạn).
 * - format cũ 'first_night' (phạt theo tiền, không map thẳng %) hoặc rỗng ⇒ dùng Moderate.
 */
export const parseCancellationPolicy = (raw: Prisma.JsonValue | null | undefined): CancellationPolicy => {
  const p = raw as
    | { tiers?: CancellationTier[]; noShowRefundPercent?: number; freeUntilHours?: number; latePenalty?: string }
    | null;
  if (p?.tiers && Array.isArray(p.tiers) && p.tiers.length > 0) {
    const tiers = [...p.tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
    return { tiers, noShowRefundPercent: p.noShowRefundPercent ?? 0 };
  }
  if (typeof p?.freeUntilHours === 'number' && p.latePenalty === 'full') {
    return { tiers: [T(p.freeUntilHours, 100), T(0, 0)], noShowRefundPercent: 0 };
  }
  return DEFAULT_CANCELLATION_POLICY;
};

/** Đọc chính sách huỷ đã cấu hình ở hotel.settings.cancellation, thiếu/không hợp lệ thì dùng mặc định. */
export const readCancellationPolicy = (settings: Prisma.JsonValue | null): CancellationPolicy => {
  const parsed = settings as unknown as { cancellation?: Prisma.JsonValue } | null;
  return parseCancellationPolicy(parsed?.cancellation);
};

/** Bậc áp dụng cho một mốc "còn bao nhiêu giờ tới check-in" (bậc đầu tiên có hoursBeforeCheckIn ≥ minHoursBefore). */
export const appliedTierForHours = (policy: CancellationPolicy, hoursBeforeCheckIn: number): CancellationTier | null =>
  policy.tiers.find((t) => hoursBeforeCheckIn >= t.minHoursBefore) ?? null;

/** % hoàn cho một mốc giờ; không khớp bậc nào (đã quá check-in) ⇒ 0. */
export const refundPercentForHours = (policy: CancellationPolicy, hoursBeforeCheckIn: number): number =>
  appliedTierForHours(policy, hoursBeforeCheckIn)?.refundPercent ?? 0;

/** "Huỷ trước bao nhiêu giờ thì hoàn 100%" = mốc minHoursBefore nhỏ nhất còn cho 100%; null nếu không có bậc 100%. */
export const freeUntilHoursOf = (policy: CancellationPolicy): number | null => {
  const full = policy.tiers.filter((t) => t.refundPercent === 100).map((t) => t.minHoursBefore);
  return full.length ? Math.min(...full) : null;
};

/** Bậc THẤP HƠN kế tiếp (tiers giảm dần) — dùng để cảnh báo "sau mốc X sẽ chỉ còn hoàn Y%". */
export const nextTierAfter = (policy: CancellationPolicy, applied: CancellationTier | null): CancellationTier | null => {
  if (!applied) return null;
  const idx = policy.tiers.findIndex((t) => t.minHoursBefore === applied.minHoursBefore);
  return idx >= 0 && idx < policy.tiers.length - 1 ? policy.tiers[idx + 1] : null;
};
