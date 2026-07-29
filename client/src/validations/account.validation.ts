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
