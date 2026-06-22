import type {
  VerificationStatus,
  VerificationApplication,
  HotelImage,
} from './hotel-verify.types';

export type { VerificationStatus };
export type ReviewDecision = 'approve' | 'reject';

// ─── List response (GET /registrations) ───────────────────────────────────────
// Lighter than the detail: hotel carries only cover images, plus the partner.

export interface VerificationListPartner {
  id: string;
  ownerId: string;
  businessName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
}

export interface VerificationListHotel {
  id: string;
  name: string;
  address: string;
  city: string;
  starRating: number | null;
  isActive: boolean;
  isListed: boolean;
  images: HotelImage[]; // cover thumbnails only
}

export interface VerificationListItem {
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
  hotel: VerificationListHotel;
  partner: VerificationListPartner;
}

export interface PaginatedVerificationRequests {
  results: VerificationListItem[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

// Detail is the full application shape (shared with the partner side).
export type VerificationRequestDetail = VerificationApplication;

// ─── Review DTOs ───────────────────────────────────────────────────────────────

export interface ReviewRegistrationDto {
  decision: ReviewDecision;
  rejectionReason?: string;
}

export interface ReviewDocumentDto {
  decision: ReviewDecision;
}

// ─── List query params ─────────────────────────────────────────────────────────

export interface ListVerificationParams {
  status?: VerificationStatus;
  sortBy?: string;
  limit?: number;
  page?: number;
}
