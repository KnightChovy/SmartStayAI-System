/**
 * Luật kiểm ô nhập của luồng xác thực — bám đúng hợp đồng BE
 * (`server/src/validations/auth.validation.ts` + `custom.validation.ts`).
 * Đổi ở đây thì phải đổi cả `client/src/validations/auth.validation.ts` cho khớp.
 *
 * Mọi hàm nhận `t` (từ `useTranslation()` của nơi gọi) và trả CHUỖI ĐÃ DỊCH — key
 * luôn mang tiền tố `auth:` nên gọi được từ bất kỳ màn nào bất kể namespace mặc định
 * (mọi namespace đã được nạp sẵn lúc khởi tạo i18n, xem `i18n/index.ts`).
 */

/**
 * Chữ ký tối giản của `t()` — đủ cho các hàm thuần ngoài React tree này dùng.
 * `key: any`: `t()` của i18next-react là type do CustomTypeOptions sinh ra theo ĐÚNG
 * namespace đã `useTranslation()` ở nơi gọi — không có kiểu chung nào tương thích với
 * mọi biến thể đó. Gõ `string` ở đây sẽ bị TS từ chối gán `TFunction<...>` vào tham số
 * (kiểm tra contravariant trên tham số key). Không ảnh hưởng an toàn thật: các key
 * truyền vào bên dưới đều là chuỗi hằng đã xác nhận tồn tại trong JSON.
 */
type Translate = (key: any, options?: any) => string;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 6–20 ký tự: trần 20 là giới hạn cột `phone` của BE (`Joi.string().max(20)`). */
const PHONE_RE = /^[0-9+()\s.-]{6,20}$/;

export function emailError(value: string, t: Translate): string | null {
  if (!value.trim()) return t('auth:errors.validation.emailRequired');
  return EMAIL_RE.test(value.trim()) ? null : t('auth:errors.validation.emailInvalid');
}

export const PASSWORD_MIN_LENGTH = 8;

/** Mã lỗi mật khẩu — dùng khi nơi gọi cần tự quyết câu chữ theo ngữ cảnh riêng. */
export type PasswordViolation = 'required' | 'tooShort' | 'needLetterAndNumber';

/**
 * Một nguồn chân lý cho luật mật khẩu, khớp `custom.validation.password` của BE:
 * ≥8 ký tự, có ít nhất 1 chữ và 1 số. Dùng cho đăng ký, đặt lại và đổi mật khẩu.
 */
export function passwordViolation(value: string): PasswordViolation | null {
  if (!value) return 'required';
  if (value.length < PASSWORD_MIN_LENGTH) return 'tooShort';
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return 'needLetterAndNumber';
  return null;
}

/** Dịch mã lỗi mật khẩu sang chuỗi hiển thị. */
export function passwordViolationMessage(violation: PasswordViolation, t: Translate): string {
  switch (violation) {
    case 'required':
      return t('auth:errors.validation.passwordRequired');
    case 'tooShort':
      return t('auth:errors.validation.passwordTooShort', { count: PASSWORD_MIN_LENGTH });
    case 'needLetterAndNumber':
      return t('auth:errors.validation.passwordNeedLetterAndNumber');
  }
}

export function passwordError(value: string, t: Translate): string | null {
  const violation = passwordViolation(value);
  return violation ? passwordViolationMessage(violation, t) : null;
}

/**
 * Đăng nhập: BE chỉ khai `Joi.string().required()` — cố ý KHÔNG áp luật độ dài ở đây,
 * tài khoản cũ có thể có mật khẩu ngắn hơn luật hiện tại mà BE vẫn cho đăng nhập.
 */
export function loginPasswordError(value: string, t: Translate): string | null {
  return value ? null : t('auth:errors.validation.passwordRequired');
}

export function fullNameError(value: string, t: Translate): string | null {
  const normalized = value.trim();
  if (!normalized) return t('auth:errors.validation.fullNameRequired');
  if (normalized.length > 255) return t('auth:errors.validation.fullNameTooLong');
  return null;
}

/**
 * @param required Trần 20 áp dụng ở checkout (bắt buộc nhập); ở hồ sơ tài khoản thì để
 * trống vẫn hợp lệ (không bắt buộc) — cùng một luật định dạng, khác mỗi yêu cầu bắt buộc.
 */
export function phoneError(value: string, t: Translate, required = false): string | null {
  const normalized = value.trim();
  if (!normalized) return required ? t('auth:errors.validation.phoneRequired') : null;
  return PHONE_RE.test(normalized) ? null : t('auth:errors.validation.phoneInvalid');
}

/** Mã OTP do BE sinh là 6 chữ số (`verificationCode` bắt buộc, `.length(6)`). */
export function otpError(value: string, t: Translate): string | null {
  return /^\d{6}$/.test(value.trim()) ? null : t('auth:errors.validation.otpInvalid');
}
