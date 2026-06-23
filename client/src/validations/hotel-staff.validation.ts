import { z } from 'zod';

/**
 * Validation cho form tạo + gán nhân viên khách sạn (POST /hotels/:hotelId/staff).
 * Rule mật khẩu khớp với BE (custom password): tối thiểu 8 ký tự, có cả chữ và số.
 * `phone` để trống được (gửi `null` ở tầng submit).
 */
export const addStaffFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(255, 'Max 255 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{8,15}$/, 'Please enter a valid phone number')
    .or(z.literal(''))
    .optional(),
  assignedRole: z.enum(['staff', 'marketer']),
});

export type AddStaffFormValues = z.infer<typeof addStaffFormSchema>;
