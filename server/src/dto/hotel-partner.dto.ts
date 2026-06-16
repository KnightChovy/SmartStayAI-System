import type {
  BusinessType,
  LicenseValidityStatus,
  RepresentativeRole,
  VerificationRequestStatus,
} from '@prisma/client';

// ⚠️ Payload đăng ký bám đúng cấu trúc lồng mà client gửi (businessInfo / businessLicense /
// certificates / propertyImages / paymentPayouts). Service sẽ map sang các model Prisma.

export interface GeoLocationDto {
  lat: number;
  lng: number;
}

export interface BusinessInfoDto {
  businessName: string;
  businessType?: BusinessType | null;
  businessRegistrationNumber?: string | null;
  taxCode?: string | null;
  phone?: string | null;
  email?: string | null;
  address: string;
  cityProvince: string;
  district?: string | null;
  ward?: string | null;
  location?: GeoLocationDto | null;
}

export interface BusinessLicenseDto {
  licenseNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  authority?: string | null;
  status?: LicenseValidityStatus | null;
  documentFileUrl: string;
}

export interface OperatingLicenseDto {
  licenseNumber?: string | null;
  issueDate?: string | null;
  authority?: string | null;
  documentFileUrl: string;
}

export interface FireSafetyDto {
  certificateNumber?: string | null;
  issueDate?: string | null;
  documentFileUrl: string;
}

export interface SecurityOrderDto {
  certificateNumber?: string | null;
  issueDate?: string | null;
  documentFileUrl: string;
}

export interface ClassificationDto {
  starRating: '1' | '2' | '3' | '4' | '5' | 'unrated';
  ratingCertificateFileUrl: string;
}

export interface CertificatesDto {
  operatingLicense?: OperatingLicenseDto;
  fireSafety?: FireSafetyDto;
  securityOrder?: SecurityOrderDto;
  classification?: ClassificationDto;
}

export interface RegisterRepresentativeDto {
  fullName: string;
  role: RepresentativeRole;
  dob?: string | null;
  idNumber: string;
  phone?: string | null;
  address?: string | null;
  idFrontImageUrl?: string | null;
  idBackImageUrl?: string | null;
}

export interface PropertyImagesDto {
  coverImages: string[];
  exteriorImages: string[];
  roomImages: string[];
}

// Khai báo cấu hình phòng lúc đăng ký (tách khỏi phòng vận hành thật ở room_types/rooms)
export interface RoomConfigTypeDto {
  name: string;
  quantity: number;
}

export interface RoomConfigDto {
  totalRooms: number;
  roomTypes: RoomConfigTypeDto[];
}

export interface BankAccountDto {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  bankBranch?: string | null;
  swiftCode?: string | null;
}

export interface TaxInvoiceDto {
  taxIdVatNumber?: string | null;
  registeredBusinessAddress?: string | null;
}

export interface PaymentPayoutsDto {
  bankAccount: BankAccountDto;
  taxInvoice?: TaxInvoiceDto;
}

export interface RegisterHotelDto {
  businessInfo: BusinessInfoDto;
  businessLicense: BusinessLicenseDto;
  certificates: CertificatesDto;
  representative: RegisterRepresentativeDto;
  propertyImages: PropertyImagesDto;
  roomConfig: RoomConfigDto;
  paymentPayouts: PaymentPayoutsDto;
}

/** Quyết định duyệt cả hồ sơ của platform_manager */
export interface ReviewRequestDto {
  decision: 'approve' | 'reject';
  rejectionReason?: string;
}

/** Duyệt / từ chối một giấy tờ đơn lẻ (Hướng B - duyệt từng file) */
export interface ReviewDocumentDto {
  decision: 'approve' | 'reject';
}

/** Partner nộp lại file mới cho một giấy tờ bị từ chối */
export interface ReplaceDocumentDto {
  fileUrl: string;
}

export interface VerificationRequestFilter {
  status?: VerificationRequestStatus;
}

export interface VerificationRequestQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}
