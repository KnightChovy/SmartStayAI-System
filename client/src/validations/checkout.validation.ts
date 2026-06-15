import { z } from 'zod';

/** Form thông tin khách ở bước 1 của checkout. */
export const guestDetailsSchema = z.object({
  fullName: z.string().min(2, { message: 'Please enter your full name.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(6, { message: 'Please enter a valid phone number.' }),
  specialRequests: z.string().max(1000).optional(),
});

export type GuestDetailsValues = z.infer<typeof guestDetailsSchema>;
