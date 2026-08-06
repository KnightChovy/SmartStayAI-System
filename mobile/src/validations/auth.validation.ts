/**
 * Luật kiểm ô nhập của luồng xác thực — bám đúng hợp đồng BE
 * (`server/src/validations/auth.validation.ts` + `custom.validation.ts`).
 * Đổi ở đây thì phải đổi cả `client/src/validations/auth.validation.ts` cho khớp.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 6–20 ký tự: trần 20 là giới hạn cột `phone` của BE (`Joi.string().max(20)`). */
const PHONE_RE = /^[0-9+()\s.-]{6,20}$/;

export function emailError(value: string): string | null {
  if (!value.trim()) return 'Email là bắt buộc.';
  return EMAIL_RE.test(value.trim()) ? null : 'Email chưa đúng định dạng.';
}

export const PASSWORD_MIN_LENGTH = 8;

/** Mã lỗi mật khẩu — màn đã i18n hoá tự map sang key của mình thay vì dùng chuỗi thô. */
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

const PASSWORD_MESSAGES: Record<PasswordViolation, string> = {
  required: 'Mật khẩu là bắt buộc.',
  tooShort: `Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
  needLetterAndNumber: 'Mật khẩu cần gồm chữ và số.',
};

export function passwordError(value: string): string | null {
  const violation = passwordViolation(value);
  return violation ? PASSWORD_MESSAGES[violation] : null;
}

/**
 * Đăng nhập: BE chỉ khai `Joi.string().required()` — cố ý KHÔNG áp luật độ dài ở đây,
 * tài khoản cũ có thể có mật khẩu ngắn hơn luật hiện tại mà BE vẫn cho đăng nhập.
 */
export function loginPasswordError(value: string): string | null {
  return value ? null : 'Mật khẩu là bắt buộc.';
}

export function fullNameError(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return 'Họ tên là bắt buộc.';
  if (normalized.length > 255) return 'Họ tên không quá 255 ký tự.';
  return null;
}

export function phoneError(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return null;
  return PHONE_RE.test(normalized) ? null : 'Số điện thoại chưa hợp lệ.';
}

/** Mã OTP do BE sinh là 6 chữ số (`verificationCode` bắt buộc, `.length(6)`). */
export function otpError(value: string): string | null {
  return /^\d{6}$/.test(value.trim()) ? null : 'Mã xác thực phải gồm 6 chữ số.';
}
