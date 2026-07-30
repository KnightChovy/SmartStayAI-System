import { z } from 'zod';

/**
 * Validation cho thao tác quầy lễ tân (staff portal).
 *
 * Cùng nghiệp vụ với `hotel-booking.validation.ts` của partner, nhưng staff không dùng RHF
 * (trang chi tiết booking là các nút hành động, không phải một form) nên ở đây export cả
 * hằng giới hạn để gắn thẳng `maxLength` vào input — chặn tại chỗ gõ, không đợi submit.
 */

/** Trần mã voucher — khớp Joi `checkInBooking` và `lookupBookingByVoucher` của BE (max 50). */
export const VOUCHER_CODE_MAX = 50;

export const voucherCodeSchema = z
  .string()
  .trim()
  .min(1, 'Enter a voucher code.')
  .max(VOUCHER_CODE_MAX, `Voucher code is limited to ${VOUCHER_CODE_MAX} characters.`);

/** Mã voucher lúc check-in là TUỲ CHỌN (bỏ trống = không đối chiếu voucher). */
export const optionalVoucherCodeSchema = z
  .string()
  .trim()
  .max(VOUCHER_CODE_MAX, `Voucher code is limited to ${VOUCHER_CODE_MAX} characters.`);

/**
 * Lý do trả phòng muộn — CHỈ dùng ở phía client (đưa vào hộp xác nhận để lễ tân đọc lại trước
 * khi chốt); `checkOut` của BE không nhận field này nên không có ràng buộc nào phải khớp.
 * Vẫn chặn độ dài để không có dòng lý do dài vô tận tràn hộp thoại.
 */
export const LATE_CHECKOUT_REASON_MAX = 200;

export const lateCheckoutReasonSchema = z
  .string()
  .trim()
  .min(1, 'Enter a reason for the late check-out.')
  .max(
    LATE_CHECKOUT_REASON_MAX,
    `Reason is limited to ${LATE_CHECKOUT_REASON_MAX} characters.`
  );
