import { z } from 'zod';

/** Nhân viên trả lời khách. Trần 2000 ký tự khớp Joi ở BE (`replyConversation`). */
export const staffReplySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please write a reply before sending.')
    .max(2000, 'Replies are limited to 2000 characters.'),
});

export type StaffReplyFormValues = z.infer<typeof staffReplySchema>;
