import type { ChargeFrequency } from '@/types/hotel-property.types';
import type { TaxFeeEstimate, TaxFeeEstimateInput } from '@/types/booking.types';

/**
 * ƯỚC TÍNH thuế & phí cho một kỳ ở — mirror `computeTaxAndFees` của backend
 * (`server/src/services/booking.service.ts`, hàm cùng tên).
 *
 * Vì sao phải tính lại ở client: trang `/booking` chưa tạo booking nên BE chưa có
 * `taxAmount`/`feeAmount` thật, mà `GET /hotels/:hotelId/room-types` chỉ trả `totalPrice`
 * **tiền phòng thuần**. Không tính thì khách thấy tổng thấp hơn số VNPay/SePay charge.
 *
 * ⚠️ Đây chỉ là ước tính để HIỂN THỊ. Số thật là `booking.totalAmount` từ `POST /bookings`
 * — luôn ưu tiên số đó khi đã có. Nếu sửa công thức ở BE thì phải sửa cả file này.
 *
 * Chỉ tính `tax` + `fee`. `deposit` là tiền cọc thu/trả tại khách sạn, KHÔNG nằm trong giá đơn;
 * `cancellation`/`parking`/`internet` là mô tả, không phải khoản thu bắt buộc.
 *
 * @returns `null` khi chưa biết chính sách (`policies === undefined`) — call site phải im lặng
 *   thay vì khẳng định "không có thuế". `[]` (KS không có chính sách) trả về 0/0 — đó là câu
 *   trả lời thật, không phải "chưa biết".
 */
export function estimateTaxAndFees({
  policies,
  subtotal,
  numNights,
  numGuests,
}: TaxFeeEstimateInput): TaxFeeEstimate | null {
  if (!policies) return null;

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

  for (const policy of policies) {
    if (policy.policyType !== 'tax' && policy.policyType !== 'fee') continue;
    const amount = Number(policy.amount);
    // Khớp `!policy.amount` của BE: null / '' / 0 / NaN đều bị bỏ qua.
    if (!policy.amount || Number.isNaN(amount) || amount === 0) continue;

    const raw = policy.isPercentage
      ? (subtotal * amount) / 100
      : amount * multipliers[policy.chargeFrequency ?? 'per_stay'];

    // Làm tròn TỪNG khoản rồi mới cộng dồn — khớp `.toDecimalPlaces(2)` của BE.
    // Gộp lại làm tròn một lần ở cuối sẽ lệch vài xu khi KS có nhiều chính sách lẻ.
    const value = Math.round(raw * 100) / 100;

    if (policy.policyType === 'tax') taxAmount += value;
    else feeAmount += value;
  }

  return { taxAmount, feeAmount, total: subtotal + taxAmount + feeAmount };
}
