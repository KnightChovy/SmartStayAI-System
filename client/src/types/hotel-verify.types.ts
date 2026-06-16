// ─── Shared enums (per API spec) ──────────────────────────────────────────────

export type VerificationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';
export type DocumentType =
  | 'business_license'
  | 'operating_license'
  | 'fire_safety'
  | 'security_order'
  | 'classification'
  // present in the backend enum but not emitted by the current form
  | 'tax_certificate'
  | 'owner_id'
  | 'property_proof';
export type LicenseType =
  | 'business_license'
  | 'operating_license'
  | 'fire_safety'
  | 'security_order'
  | 'classification';
export type LicenseValidityStatus = 'active' | 'pending' | 'expired';
export type StarRating = '1' | '2' | '3' | '4' | '5' | 'unrated';
export type BusinessType = 'hotel' | 'resort' | 'villa' | 'apartment';
export type RepresentativeRole =
  | 'owner'
  | 'general_manager'
  | 'legal_representative'
  | 'director';

// ─── Detail-response entities (GET /registrations/:id, /registrations/me) ──────

export interface VerificationDocument {
  id: string;
  verificationRequestId: string;
  partnerId: string;
  hotelId: string;
  documentType: DocumentType;
  fileUrl: string;
  status: DocumentStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  replacedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationLicense {
  id: string;
  hotelId: string;
  verificationRequestId: string;
  licenseType: LicenseType;
  licenseNumber: string | null;
  certificateNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  authority: string | null;
  validityStatus: LicenseValidityStatus | null;
  starRating: StarRating | null;
  currentDocumentId: string | null;
  currentDocument: VerificationDocument | null;
  createdAt: string;
  updatedAt: string;
}

export interface HotelImage {
  id: string;
  hotelId: string;
  imageCategory: 'cover' | 'exterior' | 'room' | string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface HotelRoomType {
  id: string;
  roomConfigId: string;
  name: string;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelRoomConfig {
  id: string;
  hotelId: string;
  totalRooms: number;
  types: HotelRoomType[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelRepresentative {
  id: string;
  hotelId: string;
  partnerId: string;
  fullName: string;
  role: RepresentativeRole | string;
  dateOfBirth: string | null;
  idNumber: string;
  phone: string | null;
  address: string | null;
  idFrontImageUrl: string | null;
  idBackImageUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelPayoutAccount {
  id: string;
  accountHolder: string;
  bankName: string;
  // accountNumber is never returned (encrypted server-side)
  bankBranch: string | null;
  swiftCode: string | null;
  taxIdVatNumber: string | null;
  registeredBusinessAddress: string | null;
  isPrimary: boolean;
}

export interface VerificationHotel {
  id: string;
  partnerId: string;
  name: string;
  slug: string | null;
  description: string | null;
  address: string;
  city: string;
  country: string;
  businessType: BusinessType | string | null;
  businessRegistrationNumber: string | null;
  taxCode: string | null;
  district: string | null;
  ward: string | null;
  // Decimal fields are serialised as strings by the backend
  latitude: string | null;
  longitude: string | null;
  starRating: number | null;
  isActive: boolean;
  isListed: boolean;
  createdAt?: string;
  updatedAt?: string;
  images: HotelImage[];
  roomConfig: HotelRoomConfig | null;
  representatives: HotelRepresentative[];
  payoutAccounts: HotelPayoutAccount[];
}

export interface VerificationReviewer {
  id: string;
  fullName: string;
  email: string;
}

export interface VerificationPartner {
  id: string;
  ownerId: string;
  businessName: string;
  businessLicense?: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  commissionRate?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

/**
 * Full verification request — shape returned by:
 *  - POST   /registrations            (201)
 *  - GET    /registrations/me         (array)
 *  - GET    /registrations/:requestId
 *  - PATCH  /registrations/:requestId/review
 */
export interface VerificationApplication {
  id: string;
  partnerId: string;
  hotelId: string;
  status: VerificationStatus;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  hotel: VerificationHotel;
  partner: VerificationPartner;
  documents: VerificationDocument[];
  licenses: VerificationLicense[];
  reviewer: VerificationReviewer | null;
}

// ─── Submit-request DTOs (POST /registrations body) ───────────────────────────

export interface LocationDto {
  lat: number;
  lng: number;
}

export interface SaveBusinessInfoDto {
  businessName: string;
  businessType: string;
  businessRegistrationNumber: string;
  taxCode?: string;
  phone: string;
  email: string;
  address: string;
  cityProvince: string;
  district?: string;
  ward?: string;
  location: LocationDto;
}

export interface RoomTypeDto {
  name: string;
  quantity: number;
}

export interface RoomConfigDto {
  totalRooms: number;
  roomTypes: RoomTypeDto[];
}

export interface SaveBusinessLicenseDto {
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  authority: string;
  status: string;
  documentFileUrl: string;
}

export interface SaveCertificatesDto {
  operatingLicense?: {
    licenseNumber: string;
    issueDate: string;
    authority: string;
    documentFileUrl: string;
  };
  fireSafety?: {
    certificateNumber: string;
    issueDate: string;
    documentFileUrl: string;
  };
  securityOrder?: {
    certificateNumber: string;
    issueDate: string;
    documentFileUrl: string;
  };
  classification?: {
    starRating: string;
    ratingCertificateFileUrl: string;
  };
}

export interface SaveRepresentativeDto {
  fullName: string;
  role: string;
  dob: string;
  idNumber: string;
  phone: string;
  address: string;
  idFrontImageUrl: string;
  idBackImageUrl: string;
}

export interface SavePropertyImagesDto {
  coverImages: string[];
  exteriorImages: string[];
  roomImages: string[];
}

export interface SavePaymentPayoutsDto {
  bankAccount: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    bankBranch: string;
    swiftCode: string;
  };
  taxInvoice?: {
    taxIdVatNumber: string;
    registeredBusinessAddress: string;
  };
}

export interface HotelRegistrationRequest {
  businessInfo: SaveBusinessInfoDto;
  businessLicense: SaveBusinessLicenseDto;
  certificates: SaveCertificatesDto;
  representative: SaveRepresentativeDto;
  propertyImages: SavePropertyImagesDto;
  roomConfig: RoomConfigDto;
  paymentPayouts: SavePaymentPayoutsDto;
}

// ─── Document replace (POST /documents/:documentId/replace) ────────────────────

export interface ReplaceDocumentDto {
  fileUrl: string;
}
