import { z } from 'zod';

// ─── Date helpers (chuỗi `YYYY-MM-DD`; so sánh chuỗi = so sánh thời gian) ────────
const isDateStr = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(new Date(`${v}T00:00:00`).getTime());

const todayStr = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/** Không nằm trong tương lai (bỏ qua nếu chưa hợp lệ để refine khác báo). */
const notFuture = (v: string) => !isDateStr(v) || v <= todayStr();

/** Số tuổi tính đến hôm nay từ chuỗi `YYYY-MM-DD`. */
const ageFrom = (from: string) => {
  const f = new Date(`${from}T00:00:00`);
  const t = new Date(`${todayStr()}T00:00:00`);
  let age = t.getFullYear() - f.getFullYear();
  const m = t.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < f.getDate())) age--;
  return age;
};

export const businessInfoSchema = z.object({
  businessName: z.string().min(1, 'Business name is required '),
  businessType: z.string().min(1, 'Business type is required'),
  businessRegistrationNumber: z
    .string()
    .min(1, 'Registration number is required'),
  taxCode: z.string().optional(),
  phone: z
    .string()
    .min(7, 'Phone number is required')
    .max(20, 'Phone number too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  cityProvince: z.string().min(1, 'City/Province is required'),
  ward: z.string().optional(),
  location: z.object(
    { lat: z.number(), lng: z.number() },
    { error: 'Please pin your property location on the map' }
  ),
});

export type BusinessInfoFormValues = z.infer<typeof businessInfoSchema>;

export const roomTypeSchema = z.object({
  name: z.string().min(1, 'Room type name is required'),
  quantity: z.coerce
    .number({ error: 'Enter a number' })
    .int('Must be a whole number')
    .min(1, 'At least 1 room'),
});

export type RoomTypeFormValues = z.infer<typeof roomTypeSchema>;

export const roomConfigSchema = z
  .object({
    totalRooms: z.coerce
      .number({ error: 'Enter total rooms' })
      .int('Must be a whole number')
      .min(1, 'At least 1 room'),
    roomTypes: z.array(roomTypeSchema).min(1, 'Add at least one room type'),
  })
  .superRefine((data, ctx) => {
    const sum = data.roomTypes.reduce((acc, t) => acc + (t.quantity || 0), 0);
    if (sum !== data.totalRooms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalRooms'],
        message: `Room type totals (${sum}) must equal total rooms (${data.totalRooms})`,
      });
    }
  });

export type RoomConfigFormValues = z.infer<typeof roomConfigSchema>;

export const propertyDetailsSchema = z
  .object({
    licenseNumber: z.string().min(1, 'License number is required'),
    issueDate: z
      .string()
      .min(1, 'Issue date is required')
      .refine(isDateStr, 'Invalid date')
      .refine(notFuture, 'Issue date cannot be in the future'),
    expiryDate: z
      .string()
      .optional()
      .refine(v => !v || isDateStr(v), 'Invalid date'),
    authority: z.string().min(1, 'Issuing authority is required'),
    status: z.enum(['active', 'pending', 'expired'], {
      error: 'Please select a status',
    }),
    documentFileUrl: z
      .string()
      .min(1, 'Please upload the business license document'),
  })
  .refine(
    d =>
      !d.expiryDate ||
      !isDateStr(d.issueDate) ||
      !isDateStr(d.expiryDate) ||
      d.expiryDate >= d.issueDate,
    { message: 'Expiry date must be on or after the issue date', path: ['expiryDate'] }
  );

export type PropertyDetailsFormValues = z.infer<typeof propertyDetailsSchema>;

export const accommodationCertificateSchema = z.object({
  operatingLicense: z.object({
    licenseNumber: z.string().min(1, 'License number is required'),
    issueDate: z
      .string()
      .min(1, 'Issue date is required')
      .refine(isDateStr, 'Invalid date')
      .refine(notFuture, 'Issue date cannot be in the future'),
    authority: z.string().min(1, 'Issuing authority is required'),
    documentFileUrl: z
      .string()
      .min(1, 'Please upload the operating license document'),
  }),
  fireSafety: z.object({
    certificateNumber: z.string().min(1, 'Certificate number is required'),
    issueDate: z
      .string()
      .min(1, 'Issue date is required')
      .refine(isDateStr, 'Invalid date')
      .refine(notFuture, 'Issue date cannot be in the future'),
    documentFileUrl: z
      .string()
      .min(1, 'Please upload the fire safety document'),
  }),
  securityOrder: z
    .object({
      certificateNumber: z.string().optional(),
      issueDate: z
        .string()
        .optional()
        .refine(v => !v || isDateStr(v), 'Invalid date')
        .refine(v => !v || notFuture(v), 'Issue date cannot be in the future'),
      documentFileUrl: z.string().optional(),
    })
    .optional(),
  classification: z
    .object({
      starRating: z.string().optional(),
      ratingCertificateFileUrl: z.string().optional(),
    })
    .optional(),
});

export type AccommodationCertificateFormValues = z.infer<
  typeof accommodationCertificateSchema
>;

export const representativeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(
    ['owner', 'general_manager', 'legal_representative', 'director'],
    {
      error: 'Role is required',
    }
  ),
  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(isDateStr, 'Invalid date')
    .refine(v => !isDateStr(v) || v <= todayStr(), 'Date of birth cannot be in the future')
    .refine(v => !isDateStr(v) || ageFrom(v) >= 18, 'Representative must be at least 18 years old')
    .refine(v => !isDateStr(v) || ageFrom(v) <= 120, 'Please enter a valid date of birth'),
  idNumber: z
    .string()
    .min(9, 'ID number must be at least 9 characters')
    .max(12, 'ID number must be at most 12 characters'),
  phone: z
    .string()
    .min(7, 'Phone number is required')
    .max(20, 'Phone number too long'),
  address: z.string().min(1, 'Address is required'),
  idFrontImageUrl: z.string().min(1, 'Front ID image is required'),
  idBackImageUrl: z.string().min(1, 'Back ID image is required'),
});

export type RepresentativeFormValues = z.infer<typeof representativeSchema>;

export const propertyImagesSchema = z.object({
  coverImages: z.array(z.string()).min(1, 'At least 1 cover image is required'),
  exteriorImages: z
    .array(z.string())
    .min(1, 'At least 1 exterior image is required'),
  roomImages: z.array(z.string()).min(3, 'At least 3 room images are required'),
  roomConfig: roomConfigSchema,
});

export type PropertyImagesFormValues = z.infer<typeof propertyImagesSchema>;

export const paymentPayoutsSchema = z.object({
  bankAccount: z.object({
    accountHolder: z.string().min(1, 'Account holder name is required'),
    bankName: z.string().min(1, 'Please select a bank'),
    accountNumber: z
      .string()
      .min(6, 'Account number must be at least 6 digits'),
    bankBranch: z.string().min(1, 'Bank branch is required'),
    swiftCode: z.string().optional(),
  }),
  taxInvoice: z
    .object({
      taxIdVatNumber: z.string().optional(),
      registeredBusinessAddress: z.string().optional(),
    })
    .optional(),
});

export type PaymentPayoutsFormValues = z.infer<typeof paymentPayoutsSchema>;
