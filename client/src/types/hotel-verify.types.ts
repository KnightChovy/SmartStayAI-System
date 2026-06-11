export enum StepStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DRAFT = 'DRAFT',
}

export interface StepState {
  status: StepStatus;
  rejectReason?: string;
}

export interface VerificationApplication {
  id: string;
  hotelId: string;
  overallStatus: StepStatus;
  createdAt: string;
  updatedAt: string;
  steps: {
    businessInfo: StepState;
    propertyDetails: StepState;
    accommodationCertificate: StepState;
    representativeVerification: StepState;
    propertyImages: StepState;
    paymentPayouts: StepState;
  };
}

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

