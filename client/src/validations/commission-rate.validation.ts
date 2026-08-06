import { z } from 'zod';

/**
 * Sàn cứng của toàn hệ thống — không mức nào được thấp hơn, kể cả khi Platform Manager duyệt.
 * PHẢI khớp hằng của backend (`commission-rate.service.ts`).
 */
export const HARD_FLOOR_RATE = 10;
/** Trần của MỨC NỀN toàn sàn (ưu đãi riêng chỉ bị chặn dưới bởi sàn cứng). */
export const BASE_RATE_MAX = 30;
/** Ưu đãi luôn kéo dài đúng 12 tháng — đối tác không chọn được. */
export const AGREEMENT_MONTHS = 12;
/** Số ngày phải báo trước khi đổi mức nền toàn sàn. */
export const BASE_RATE_NOTICE_DAYS = 30;
/** Cửa sổ gia hạn: chỉ mở đơn khi ưu đãi còn ≤ 30 ngày. */
export const RENEWAL_WINDOW_DAYS = 30;

export const REASON_MIN = 10;
export const REASON_MAX = 1000;

/**
 * Đơn xin giảm hoa hồng của đối tác.
 *
 * CỐ Ý giữ `requestedRate` ở dạng string trong form (input number của HTML luôn trả string,
 * và `z.coerce` sẽ biến ô rỗng thành `0` — sai hẳn thông báo lỗi). Quy về number ở bước submit.
 *
 * Chỉ kiểm hai biên tĩnh (sàn cứng + trần 100). Điều kiện "phải thấp hơn mức đang áp"
 * KHÔNG kiểm ở đây mà để backend trả message tiếng Việt — luật có thể đổi, tự suy là hai phía
 * trôi lệch (xem §6.3 của tài liệu bàn giao).
 */
export const commissionRequestFormSchema = z.object({
  requestedRate: z
    .string()
    .trim()
    .min(1, 'Enter the rate you are proposing')
    .refine(v => !Number.isNaN(Number(v)), 'The proposed rate must be a number')
    .refine(
      v => Number(v) >= HARD_FLOOR_RATE,
      `The proposed rate cannot be below ${HARD_FLOOR_RATE}%`
    )
    .refine(v => Number(v) < 100, 'The proposed rate must be below 100%')
    .refine(v => /^\d+(\.\d{1,2})?$/.test(v), 'Max 2 decimal places'),
  reason: z
    .string()
    .trim()
    .min(REASON_MIN, `Please write at least ${REASON_MIN} characters`)
    .max(REASON_MAX, `Max ${REASON_MAX} characters`),
});

export type CommissionRequestFormValues = z.infer<
  typeof commissionRequestFormSchema
>;

/** Platform Manager đặt mức nền toàn sàn. Biên 10–30% khớp Joi của backend. */
export const baseRateFormSchema = z.object({
  rate: z
    .string()
    .trim()
    .min(1, 'Enter the base commission rate')
    .refine(v => !Number.isNaN(Number(v)), 'The rate must be a number')
    .refine(
      v => Number(v) >= HARD_FLOOR_RATE && Number(v) <= BASE_RATE_MAX,
      `The base rate must be between ${HARD_FLOOR_RATE}% and ${BASE_RATE_MAX}%`
    ),
  effectiveFrom: z.string().trim().min(1, 'Pick an effective date'),
});

export type BaseRateFormValues = z.infer<typeof baseRateFormSchema>;

/** Từ chối đơn — lý do bắt buộc (Joi của backend cũng `required`). */
export const rejectCommissionRequestFormSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, 'Please explain why this request is rejected')
    .max(500, 'Max 500 characters'),
});

export type RejectCommissionRequestFormValues = z.infer<
  typeof rejectCommissionRequestFormSchema
>;

/** Đình chỉ đối tác — lý do bắt buộc, sẽ được lưu vào `rejectionReason` của đối tác. */
export const suspendPartnerFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Please explain why this partner is being suspended')
    .max(500, 'Max 500 characters'),
});

export type SuspendPartnerFormValues = z.infer<typeof suspendPartnerFormSchema>;
