import { z } from 'zod';

export const businessInfoSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  businessRegistrationNumber: z.string().min(1, 'Registration number is required'),
  taxCode: z.string().optional(),
  phone: z.string().min(7, 'Phone number is required').max(20, 'Phone number too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  cityProvince: z.string().min(1, 'City/Province is required'),
  ward: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export type BusinessInfoFormValues = z.infer<typeof businessInfoSchema>;

export const propertyDetailsSchema = z.object({
  licenseNumber: z.string().min(1, 'License number is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().optional(),
  authority: z.string().min(1, 'Issuing authority is required'),
  status: z.enum(['active', 'pending', 'expired'], { required_error: 'Please select a status' }),
  documentFileUrl: z.string().min(1, 'Please upload the business license document'),
});

export type PropertyDetailsFormValues = z.infer<typeof propertyDetailsSchema>;

export const accommodationCertificateSchema = z.object({
  operatingLicense: z.object({
    licenseNumber: z.string().min(1, 'License number is required'),
    issueDate: z.string().min(1, 'Issue date is required'),
    authority: z.string().min(1, 'Issuing authority is required'),
    documentFileUrl: z.string().min(1, 'Please upload the operating license document'),
  }),
  fireSafety: z.object({
    certificateNumber: z.string().min(1, 'Certificate number is required'),
    issueDate: z.string().min(1, 'Issue date is required'),
    documentFileUrl: z.string().min(1, 'Please upload the fire safety document'),
  }),
  securityOrder: z
    .object({
      certificateNumber: z.string().optional(),
      issueDate: z.string().optional(),
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

export type AccommodationCertificateFormValues = z.infer<typeof accommodationCertificateSchema>;

export const representativeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['owner', 'general_manager', 'legal_representative', 'director'], {
    required_error: 'Role is required',
  }),
  dob: z.string().min(1, 'Date of birth is required'),
  idNumber: z
    .string()
    .min(9, 'ID number must be at least 9 characters')
    .max(12, 'ID number must be at most 12 characters'),
  phone: z.string().min(7, 'Phone number is required').max(20, 'Phone number too long'),
  address: z.string().min(1, 'Address is required'),
  idFrontImageUrl: z.string().min(1, 'Front ID image is required'),
  idBackImageUrl: z.string().min(1, 'Back ID image is required'),
});

export type RepresentativeFormValues = z.infer<typeof representativeSchema>;

export const propertyImagesSchema = z.object({
  coverImages: z.array(z.string()).min(1, 'At least 1 cover image is required'),
  exteriorImages: z.array(z.string()).min(1, 'At least 1 exterior image is required'),
  roomImages: z.array(z.string()).min(3, 'At least 3 room images are required'),
});

export type PropertyImagesFormValues = z.infer<typeof propertyImagesSchema>;

export const paymentPayoutsSchema = z.object({
  bankAccount: z.object({
    accountHolder: z.string().min(1, 'Account holder name is required'),
    bankName: z.string().min(1, 'Please select a bank'),
    accountNumber: z.string().min(6, 'Account number must be at least 6 digits'),
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
