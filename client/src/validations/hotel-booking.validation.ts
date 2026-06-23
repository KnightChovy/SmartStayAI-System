import { z } from 'zod';

/**
 * Validation cho các thao tác vận hành booking của Hotel Partner (owner).
 * Số nhập từ HTML input được giữ ở dạng **string**, chỉ convert sang number ở
 * tầng submit (tránh lỗi typing input/output của zod khi dùng với RHF resolver).
 */

const isNum = (v: string) => v.trim() !== '' && !Number.isNaN(Number(v));

// ─── Check-in ─────────────────────────────────────────────────────────────────

export const checkInFormSchema = z.object({
  /** '' = để BE tự chọn phòng trống cùng loại. */
  roomId: z.string().optional(),
  voucherCode: z.string().trim().max(50, 'Max 50 characters').optional(),
});

export type CheckInFormValues = z.infer<typeof checkInFormSchema>;

// ─── Check-out ────────────────────────────────────────────────────────────────

export const checkOutFormSchema = z.object({
  /** Phụ thu phát sinh (VND) — bỏ trống = 0. */
  extraCharge: z
    .string()
    .trim()
    .optional()
    .refine(v => !v || isNum(v), 'Must be a number')
    .refine(v => !v || Number(v) >= 0, 'Cannot be negative'),
});

export type CheckOutFormValues = z.infer<typeof checkOutFormSchema>;
