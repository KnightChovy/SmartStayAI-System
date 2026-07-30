import { z } from 'zod';

/**
 * Mã lỗi của form đổi mật khẩu → key i18n trong namespace `account`.
 * Zod chỉ giữ được `string` nên không mang theo được key type-safe của i18next;
 * tra qua bảng này (kèm type-guard `isPasswordErrorCode`) để không phải ép kiểu.
 */
export const PASSWORD_ERROR_KEYS = {
  currentRequired: 'settings.errors.currentRequired',
  tooShort: 'settings.errors.tooShort',
  needLetterAndNumber: 'settings.errors.needLetterAndNumber',
  confirmRequired: 'settings.errors.confirmRequired',
  mismatch: 'settings.errors.mismatch',
} as const;

export type PasswordErrorCode = keyof typeof PASSWORD_ERROR_KEYS;

export function isPasswordErrorCode(value: string): value is PasswordErrorCode {
  return value in PASSWORD_ERROR_KEYS;
}

/**
 * Đổi mật khẩu — khớp `changeMyPassword` của BE (`custom.validation.password`):
 * tối thiểu 8 ký tự, phải có ít nhất 1 chữ và 1 số. Ràng buộc "khác mật khẩu cũ"
 * do BE kiểm (chỉ nó biết hash hiện tại), FE không đoán trước.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentRequired'),
    newPassword: z
      .string()
      .min(8, 'tooShort')
      .regex(/\d/, 'needLetterAndNumber')
      .regex(/[a-zA-Z]/, 'needLetterAndNumber'),
    confirmPassword: z.string().min(1, 'confirmRequired'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'mismatch',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

/** Mã lỗi của các form khu tài khoản (hồ sơ, đánh giá, huỷ đơn) → key i18n namespace `account`. */
export const ACCOUNT_ERROR_KEYS = {
  nameRequired: 'profile.errors.nameRequired',
  nameTooLong: 'profile.errors.nameTooLong',
  phoneInvalid: 'profile.errors.phoneInvalid',
  nationalityTooLong: 'profile.errors.nationalityTooLong',
  idCardTooLong: 'profile.errors.idCardTooLong',
  passportTooLong: 'profile.errors.passportTooLong',
  dobInvalid: 'profile.errors.dobInvalid',
  imageUrlInvalid: 'review.errors.imageUrlInvalid',
  imageLimit: 'review.errors.imageLimit',
} as const;

export type AccountErrorCode = keyof typeof ACCOUNT_ERROR_KEYS;

export function isAccountErrorCode(value: string): value is AccountErrorCode {
  return value in ACCOUNT_ERROR_KEYS;
}

/**
 * Ô tuỳ chọn: BE cho phép gửi chuỗi rỗng/null để XOÁ field, nên không được dùng `.min(1)`.
 * Chỉ chặn khi khách thực sự gõ quá dài.
 *
 * CỐ Ý không dùng `.transform()`/`.optional()` ở bất kỳ field nào của schema này: transform làm
 * kiểu **đầu vào** khác kiểu **đầu ra** của zod, mà RHF suy `defaultValues` theo đầu vào và
 * `handleSubmit` theo đầu ra ⇒ phải ép kiểu lung tung. Quy đổi '' → null làm ở bước submit.
 */
const optionalText = (max: number, code: AccountErrorCode) => z.string().max(max, code);

/**
 * Hồ sơ người dùng — khớp `updateMyProfile` của BE (`server/src/validations/user.validation.ts`).
 *
 * `fullName` BẮT BUỘC dù Joi khai `Joi.string().max(255)` không có `.required()`: Joi mặc định
 * **từ chối chuỗi rỗng**, nên xoá trắng ô tên là 400 chứ không phải "giữ nguyên tên cũ".
 *
 * `avatarUrl` không có luật riêng — nó là URL do `POST /uploads` trả về, khách không gõ tay;
 * vẫn để trong schema để là field RHF thật (khỏi phải ép kiểu khi `setValue`).
 * `dateOfBirth` đã bị `DatePicker` chặn bằng `min`/`max`, ở đây chỉ chốt lại định dạng.
 */
export const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'nameRequired').max(255, 'nameTooLong'),
  // Cho phép để trống (xoá số). Có nhập thì phải 6–20 ký tự số/khoảng trắng/+-() — nới đủ rộng
  // cho số quốc tế, chặt vừa đủ để bắt lỗi gõ nhầm. Trần 20 là giới hạn cột của BE.
  phone: z.string().refine(v => v === '' || /^[\d\s+()-]{6,20}$/.test(v), 'phoneInvalid'),
  avatarUrl: z.string().nullable(),
  dateOfBirth: z.string().refine(v => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'dobInvalid'),
  nationality: optionalText(100, 'nationalityTooLong'),
  idCardNumber: optionalText(50, 'idCardTooLong'),
  passportNumber: optionalText(50, 'passportTooLong'),
  preferredLanguage: z.enum(['vi', 'en']),
  preferredCurrency: z.enum(['VND', 'USD']),
  marketingOptIn: z.boolean(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/** Trần ảnh của một đánh giá — khớp `Joi.array().max(10)` ở BE. */
export const REVIEW_IMAGE_LIMIT = 10;

/**
 * Ảnh đính kèm đánh giá: BE bắt `Joi.string().uri()`, nên chuỗi kiểu "abc" sẽ bị 400 sau khi
 * khách đã gõ xong cả bài. Chỉ nhận http/https — `uri()` của Joi cũng nhận `mailto:`… nhưng
 * thẻ `<img>` không render được, chặt hơn ở FE là đúng.
 */
export const reviewImageUrlSchema = z
  .string()
  .trim()
  .refine(v => /^https?:\/\/\S+$/i.test(v), 'imageUrlInvalid');

/**
 * Lý do huỷ đơn — khớp `cancelBooking` của BE (`reason` max 500, cho phép rỗng).
 * Chỉ cần hằng số: ô nhập là `<textarea maxLength>` nên trình duyệt đã chặn cứng, không có
 * đường nào vượt quá để phải bắt bằng schema.
 */
export const CANCEL_REASON_MAX = 500;
