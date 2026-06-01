import { z } from 'zod';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
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

const verifySchema = z.object({
  digit0: z.string().length(1, { message: '' }),
  digit1: z.string().length(1, { message: '' }),
  digit2: z.string().length(1, { message: '' }),
  digit3: z.string().length(1, { message: '' }),
  digit4: z.string().length(1, { message: '' }),
  digit5: z.string().length(1, { message: '' }),
});

type VerifyFormValues = z.infer<typeof verifySchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type RegisterInput = z.infer<typeof registerSchema>;

export {
  loginSchema,
  type LoginInput,
  registerSchema,
  type RegisterInput,
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
  verifySchema,
  type VerifyFormValues,
};
