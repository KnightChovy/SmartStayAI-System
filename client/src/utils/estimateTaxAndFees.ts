import type { ChargeFrequency } from '@/types/hotel-property.types';
import type { TaxFeeEstimate, TaxFeeEstimateInput } from '@/types/booking.types';

/**
 * ƯỚC TÍNH thuế & phí cho một kỳ ở — mirror `computeTaxAndFees` của backend
 * (`server/src/services/availability.service.ts`, hàm cùng tên).
 *
 * Vì sao vẫn cần ước tính ở client: `GET /hotels/:hotelId/room-types/:roomTypeId` (chi tiết
 * một phòng) **không** trả thuế/phí, mà trang chi tiết phòng vẫn phải báo giá cuối cho khách.
 * Còn `GET /hotels/:id/room-types` (danh sách) thì BE đã trả `taxAmount`/`feeAmount` THẬT —
 * chỗ nào có số thật thì DÙNG SỐ THẬT, đừng gọi hàm này.
 *
 * ⚠️ ĐỌC `charges`, KHÔNG phải `policies`. BE đã tách bảng (migration
 * `split_policy_and_charge`, commit `db05ed4`): `hotel_policies` giờ chỉ là điều khoản văn bản
 * (title/description/important), còn thuế/phí nằm ở `hotel_charges`. Bản cũ của file này lọc
 * theo `policy.policyType === 'tax'` — sau khi tách thì không bao giờ khớp nữa ⇒ luôn ra 0 thuế
 * và âm thầm báo giá thiếu.
 *
 * ⚠️ Đây chỉ là ước tính để HIỂN THỊ. Số thật là `booking.totalAmount` từ `POST /bookings`
 * — luôn ưu tiên số đó khi đã có. Nếu sửa công thức ở BE thì phải sửa cả file này.
 *
 * @returns `null` khi chưa biết khoản thu (`charges === undefined`) — call site phải im lặng
 *   thay vì khẳng định "không có thuế". `[]` (KS không thu gì) trả về 0/0 — đó là câu
 *   trả lời thật, không phải "chưa biết".
 */
export function estimateTaxAndFees({
  charges,
  subtotal,
  numNights,
  numGuests,
}: TaxFeeEstimateInput): TaxFeeEstimate | null {
  if (!charges) return null;

  // Phần trăm luôn tính trên subtotal (subtotal đã gồm đủ số đêm rồi) — nhân tiếp
  // theo đêm/khách sẽ thành thuế chồng thuế.
  const multipliers: Record<ChargeFrequency, number> = {
    per_stay: 1,
    per_night: numNights,
    per_person: numGuests,
    per_person_per_night: numGuests * numNights,
  };

  let taxAmount = 0;
  let feeAmount = 0;

  for (const charge of charges) {
    const amount = Number(charge.amount);
    if (!charge.amount || Number.isNaN(amount) || amount === 0) continue;

    const raw = charge.isPercentage
      ? (subtotal * amount) / 100
      : amount * multipliers[charge.chargeFrequency ?? 'per_stay'];

    // Làm tròn TỪNG khoản rồi mới cộng dồn — khớp `.toDecimalPlaces(2)` của BE.
    // Gộp lại làm tròn một lần ở cuối sẽ lệch vài xu khi KS có nhiều khoản lẻ.
    const value = Math.round(raw * 100) / 100;

    if (charge.chargeType === 'tax') taxAmount += value;
    else feeAmount += value;
  }

  return { taxAmount, feeAmount, total: subtotal + taxAmount + feeAmount };
}
