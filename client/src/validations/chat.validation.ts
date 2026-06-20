import * as z from 'zod';

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please enter a message.')
    .max(2000, 'Message must be 2000 characters or less.'),
});

export type ChatFormValues = z.infer<typeof chatSchema>;
