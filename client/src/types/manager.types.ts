import type {
  SaveBusinessInfoDto,
  SaveBusinessLicenseDto,
  SaveCertificatesDto,
  SaveRepresentativeDto,
  SavePropertyImagesDto,
  RoomConfigDto,
  SavePaymentPayoutsDto,
} from './hotel-verify.types';

export type VerificationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type ReviewDecision = 'approve' | 'reject';

export interface HotelVerificationRequestSummary {
  id: string;
  status: VerificationStatus;
  submittedAt: string;
  updatedAt: string;
  hotelName: string;
  ownerName: string;
  ownerEmail: string;
  cityProvince: string;
  businessType: string;
  totalRooms: number;
  licenseNumber: string;
  rejectionReason?: string;
}

export interface HotelVerificationRequest extends HotelVerificationRequestSummary {
  businessRegistrationNumber: string;
  taxCode?: string;
  phone: string;
  address: string;
  ward?: string;
  location: { lat: number; lng: number };
  documentUrls: string[];
}

export interface HotelVerificationDocument {
  id: string;
  requestId: string;
  documentType: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
}

export interface ReviewRegistrationDto {
  decision: ReviewDecision;
  rejectionReason?: string;
}

export interface ReviewDocumentDto {
  decision: ReviewDecision;
}

export interface PaginatedVerificationRequests {
  results: HotelVerificationRequestSummary[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface HotelVerificationRequestDetail extends HotelVerificationRequestSummary {
  businessInfo: SaveBusinessInfoDto;
  businessLicense: SaveBusinessLicenseDto;
  certificates: SaveCertificatesDto;
  representative: SaveRepresentativeDto;
  propertyImages: SavePropertyImagesDto;
  roomConfig: RoomConfigDto;
  paymentPayouts: SavePaymentPayoutsDto;
}

export interface ListVerificationParams {
  status?: VerificationStatus;
  sortBy?: string;
  limit?: number;
  page?: number;
}
