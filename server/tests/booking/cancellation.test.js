// Test engine chính sách huỷ BẬC THANG (hàm thuần export từ hotel.service, require dist). Không cần DB.
const {
  parseCancellationPolicy,
  appliedTierForHours,
  refundPercentForHours,
  freeUntilHoursOf,
  nextTierAfter,
  CANCELLATION_PRESETS,
  DEFAULT_CANCELLATION_POLICY,
} = require('../../dist/utils/cancellation-policy');

const MOD = CANCELLATION_PRESETS.moderate.policy; // 720:100, 360:100, 168:50, 72:30, 0:0

describe('refundPercentForHours — chọn bậc theo giờ trước check-in (Moderate)', () => {
  test('>30 ngày (≥720h) → 100%', () => {
    expect(refundPercentForHours(MOD, 800)).toBe(100);
    expect(refundPercentForHours(MOD, 720)).toBe(100); // biên dưới của bậc
  });
  test('15–30 ngày (360–720h) → 100%', () => {
    expect(refundPercentForHours(MOD, 500)).toBe(100);
    expect(refundPercentForHours(MOD, 360)).toBe(100);
  });
  test('7–14 ngày (168–360h) → 50%', () => {
    expect(refundPercentForHours(MOD, 240)).toBe(50);
    expect(refundPercentForHours(MOD, 168)).toBe(50);
    expect(refundPercentForHours(MOD, 359.9)).toBe(50); // ngay dưới 360
  });
  test('3–7 ngày (72–168h) → 30%', () => {
    expect(refundPercentForHours(MOD, 100)).toBe(30);
    expect(refundPercentForHours(MOD, 72)).toBe(30);
  });
  test('<72h → 0%', () => {
    expect(refundPercentForHours(MOD, 71)).toBe(0);
    expect(refundPercentForHours(MOD, 0)).toBe(0);
  });
  test('quá giờ check-in (giờ âm) → 0%', () => {
    expect(refundPercentForHours(MOD, -5)).toBe(0);
  });
});

describe('appliedTierForHours + nextTierAfter (cảnh báo bậc kế)', () => {
  test('246h → bậc {168,50}, bậc kế {72,30}', () => {
    const a = appliedTierForHours(MOD, 246);
    expect(a).toEqual({ minHoursBefore: 168, refundPercent: 50 });
    expect(nextTierAfter(MOD, a)).toEqual({ minHoursBefore: 72, refundPercent: 30 });
  });
  test('bậc thấp nhất {0,0} → không còn bậc kế', () => {
    expect(nextTierAfter(MOD, appliedTierForHours(MOD, 10))).toBeNull();
  });
  test('applied null → null', () => {
    expect(nextTierAfter(MOD, null)).toBeNull();
  });
});

describe('freeUntilHoursOf — mốc còn hoàn 100% (cho FE tương thích)', () => {
  test('Moderate → 360 (mốc 100% nhỏ nhất)', () => expect(freeUntilHoursOf(MOD)).toBe(360));
  test('Flexible → 24', () => expect(freeUntilHoursOf(CANCELLATION_PRESETS.flexible.policy)).toBe(24));
  test('Firm → 720', () => expect(freeUntilHoursOf(CANCELLATION_PRESETS.firm.policy)).toBe(720));
  test('Non-refundable → null (không có bậc 100%)', () =>
    expect(freeUntilHoursOf(CANCELLATION_PRESETS.non_refundable.policy)).toBeNull());
});

describe('parseCancellationPolicy — tương thích ngược (không cần migrate data)', () => {
  test('format MỚI (tiers) → dùng + tự sắp giảm dần', () => {
    const p = parseCancellationPolicy({
      tiers: [{ minHoursBefore: 0, refundPercent: 0 }, { minHoursBefore: 100, refundPercent: 80 }],
      noShowRefundPercent: 10,
    });
    expect(p.tiers[0].minHoursBefore).toBe(100);
    expect(p.noShowRefundPercent).toBe(10);
  });
  test("cũ 'full' → [{freeUntilHours,100},{0,0}]", () => {
    expect(parseCancellationPolicy({ freeUntilHours: 48, latePenalty: 'full' }).tiers).toEqual([
      { minHoursBefore: 48, refundPercent: 100 },
      { minHoursBefore: 0, refundPercent: 0 },
    ]);
  });
  test("cũ 'first_night' (phạt theo tiền) → Moderate default", () => {
    expect(parseCancellationPolicy({ freeUntilHours: 48, latePenalty: 'first_night' })).toEqual(DEFAULT_CANCELLATION_POLICY);
  });
  test('rỗng/null/undefined → Moderate default', () => {
    expect(parseCancellationPolicy(null)).toEqual(DEFAULT_CANCELLATION_POLICY);
    expect(parseCancellationPolicy(undefined)).toEqual(DEFAULT_CANCELLATION_POLICY);
  });
});

describe('Số tiền hoàn = totalPaid × refundPercent (đối chiếu bảng ví dụ spec)', () => {
  const refundOf = (hours) => Math.round((1000000 * refundPercentForHours(MOD, hours)) / 100);
  test('booking 1.000.000 — theo từng bậc', () => {
    expect(refundOf(800)).toBe(1000000); // 100%
    expect(refundOf(240)).toBe(500000); //  50%
    expect(refundOf(100)).toBe(300000); //  30%
    expect(refundOf(24)).toBe(0); //   0%
  });
});

describe('5 preset', () => {
  test('đủ 5 key', () => {
    expect(Object.keys(CANCELLATION_PRESETS).sort()).toEqual(['firm', 'flexible', 'moderate', 'non_refundable', 'strict']);
  });
  test('MỌI preset có bậc minHoursBefore=0 (phủ kín) + % không tăng khi huỷ muộn hơn', () => {
    for (const k of Object.keys(CANCELLATION_PRESETS)) {
      const tiers = CANCELLATION_PRESETS[k].policy.tiers;
      expect(tiers.some((t) => t.minHoursBefore === 0)).toBe(true);
      const sorted = [...tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
      for (let i = 1; i < sorted.length; i += 1) {
        expect(sorted[i].refundPercent).toBeLessThanOrEqual(sorted[i - 1].refundPercent);
      }
    }
  });
});
