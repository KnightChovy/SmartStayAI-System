import type { ReactNode } from 'react';
import type { UserRole } from '@/constants/roles';
import type { Paginated } from '@/types/api.types';
import type { HotelImage } from '@/types/hotel.types';
import type { HotelBooking } from '@/types/staff.types';

export interface AdminNavbarProps {
  searchPlaceholder: string;
}

export interface AdminAnalyticsHeaderProps {
  title: string;
  description: string;
}

export interface AdminAnalyticsKpiCardProps {
  label: string;
  value: string;
  delta: string;
}

export interface AdminBookingsFiltersProps {
  searchPlaceholder: string;
}

export interface AdminBookingsTableProps {
  rows: string[][];
}

export interface AdminDashboardStatCardProps {
  label: string;
  value: string;
  trend: string;
}

export interface AdminPropertiesTableProps {
  rows: string[][];
}

export interface AdminUsersTableProps {
  rows: string[][];
}

export interface AdminPageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export interface AdminTableProps {
  headers: string[];
  rows: string[][];
  renderLastColumn?: (row: string[]) => ReactNode;
}

// ============================================================
// Backend admin API types
// ============================================================

export type AdminUserStatus = 'active' | 'inactive' | 'suspended' | string;

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: AdminUserStatus;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersParams {
  name?: string;
  role?: UserRole;
  sortBy?: string;
  limit?: number;
  page?: number;
}

export interface AdminCreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AdminUpdateUserPayload {
  email?: string;
  password?: string;
  name?: string;
}

export type AdminUsersResponse = Paginated<AdminUser>;

export type VerificationRequestStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected';

export interface AdminHotelPartner {
  id: string;
  businessName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: string;
}

export interface AdminHotelSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  isActive?: boolean;
  isListed?: boolean;
  images?: HotelImage[];
}

export interface AdminHotelVerificationRequest {
  id: string;
  partnerId: string;
  hotelId: string;
  status: VerificationRequestStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  hotel: AdminHotelSummary;
  partner: AdminHotelPartner;
}

export interface AdminVerificationRequestsParams {
  status?: VerificationRequestStatus;
  sortBy?: string;
  limit?: number;
  page?: number;
}

export interface AdminReviewVerificationPayload {
  decision: 'approve' | 'reject';
  rejectionReason?: string;
}

export type AdminVerificationRequestsResponse =
  Paginated<AdminHotelVerificationRequest>;

export interface AdminBooking extends HotelBooking {
  hotelName: string;
}
