import { z } from 'zod';

const bookingSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z
    .string()
    .min(2, { message: 'Last name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  country: z.string().min(1, { message: 'Please select your country.' }),
  phone: z.string().min(6, { message: 'Please enter a valid phone number.' }),
  specialRequests: z.string().optional(),
  arrivalTime: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export { bookingSchema, type BookingFormValues };
