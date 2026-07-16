import { z } from 'zod';

export const rejectRefundFormSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, 'Please explain why this refund is rejected')
    .max(500, 'Max 500 characters'),
});

export type RejectRefundFormValues = z.infer<typeof rejectRefundFormSchema>;

/**
 * Platform Manager đánh dấu đã chuyển khoản. `confirmed` là guard CHỈ Ở CLIENT (BE không có
 * field này): thao tác chuyển tiền thật, không hoàn tác được, nên phải chặn bấm nhầm.
 */
export const processRefundFormSchema = z.object({
  refundTransactionId: z
    .string()
    .trim()
    .min(1, 'Enter the real bank/gateway transaction id')
    .max(100, 'Max 100 characters'),
  confirmed: z
    .boolean()
    .refine(v => v, 'Confirm that the money has already been transferred'),
});

export type ProcessRefundFormValues = z.infer<typeof processRefundFormSchema>;
