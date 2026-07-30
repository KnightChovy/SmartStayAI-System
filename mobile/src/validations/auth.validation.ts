const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\s.-]{8,20}$/;

export function emailError(value: string): string | null {
  if (!value.trim()) return 'Email là bắt buộc.';
  return EMAIL_RE.test(value.trim()) ? null : 'Email chưa đúng định dạng.';
}

export function passwordError(value: string): string | null {
  if (!value) return 'Mật khẩu là bắt buộc.';
  if (value.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự.';
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return 'Mật khẩu cần gồm chữ và số.';
  return null;
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

export function otpError(value: string): string | null {
  return /^\d{6}$/.test(value.trim()) ? null : 'Mã xác thực phải gồm 6 chữ số.';
}
