import { z } from 'zod';

/**
 * Mật khẩu — khớp `custom.validation.password` của BE (`server/src/validations/custom.validation.ts`):
 * tối thiểu 8 ký tự, phải có ít nhất 1 chữ và 1 số. BE dùng đúng luật này cho
 * `register`, `register-partner`, `reset-password` và `PATCH /users/me/password`.
 *
 * PHẢI kiểm ở FE: luồng đăng ký gửi OTP trước rồi mới `POST /auth/register`, nên nếu
 * để BE bắt lỗi thì khách chỉ thấy "password must be at least 8 characters" ở màn nhập
 * OTP — sau khi đã rời trang có ô mật khẩu, không còn chỗ nào để sửa.
 */
const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least 1 letter and 1 number')
  .regex(/\d/, 'Password must contain at least 1 letter and 1 number');

const emailField = z
  .string()
  .min(1, 'Email address is required')
  .email('Please enter a valid email address');

/**
 * Đăng nhập: BE chỉ khai `Joi.string().required()` cho cả email lẫn password —
 * cố ý KHÔNG áp luật độ dài mật khẩu ở đây (tài khoản cũ có thể có mật khẩu ngắn hơn
 * luật hiện tại; chặn ở FE là khoá chính chủ ra ngoài mà BE vẫn cho vào).
 */
const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    // BE `Joi.string().required()`; trần 255 theo cột `full_name` của DB.
    name: z.string().trim().min(1, 'Full name is required').max(255, 'Full name is too long'),
    email: emailField,
    password: passwordField,
    // Chỉ có ở FE — BE không nhận `confirmPassword`.
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const welcomeProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(255, 'Full name is too long'),
  email: z.string().trim().min(1, 'Email address is required').email('Please enter a valid email address'),
  // Cùng luật với `profileSchema` (account.validation): 6–20 ký tự, trần 20 là giới hạn
  // cột `phone` của BE (`Joi.string().max(20)`).
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s+()-]{6,20}$/, 'Please enter a valid phone number')
    .or(z.literal('')),
});

const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email address.' })
    .email({ message: 'Please enter a valid email address.' }),
});

/**
 * Mã OTP — BE bắt `Joi.string().required().length(6)` và mã do BE sinh là 6 CHỮ SỐ.
 * Mỗi ô một chữ số; message để trống vì lỗi đã lộ ra bằng chính ô còn rỗng.
 */
const otpDigit = z.string().regex(/^\d$/, { message: '' });

const verifySchema = z.object({
  digit0: otpDigit,
  digit1: otpDigit,
  digit2: otpDigit,
  digit3: otpDigit,
  digit4: otpDigit,
  digit5: otpDigit,
});

type VerifyFormValues = z.infer<typeof verifySchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type RegisterInput = z.infer<typeof registerSchema>;
type WelcomeProfileInput = z.infer<typeof welcomeProfileSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export {
  loginSchema,
  type LoginInput,
  registerSchema,
  type RegisterInput,
  welcomeProfileSchema,
  type WelcomeProfileInput,
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
  verifySchema,
  type VerifyFormValues,
  resetPasswordSchema,
  type ResetPasswordInput,
};
