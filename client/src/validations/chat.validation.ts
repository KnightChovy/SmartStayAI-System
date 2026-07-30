import * as z from 'zod';

/** Trần độ dài một tin nhắn — khớp Joi `sendMessage` ở BE (`message` max 2000). */
export const CHAT_MESSAGE_MAX = 2000;

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please enter a message.')
    .max(CHAT_MESSAGE_MAX, 'Message must be 2000 characters or less.'),
});

export type ChatFormValues = z.infer<typeof chatSchema>;
