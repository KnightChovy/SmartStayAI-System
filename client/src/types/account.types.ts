/**
 * Type cho các domain khu tài khoản. Model theo DB (`schema.prisma`) để khi
 * backend có API thật thì khớp shape sẵn. Hiện đang phục vụ mock.
 */

// ----- Profile (view-model phẳng dùng cho form) -----
export interface UserProfile {
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  idCardNumber?: string | null;
  passportNumber?: string | null;
  preferredLanguage: 'vi' | 'en';
  preferredCurrency: 'VND' | 'USD';
  marketingOptIn: boolean;
}

// ----- Raw API shape của GET/PATCH /users/me (khớp backend) -----
export interface UserProfileRaw {
  id: string;
  userId: string;
  dateOfBirth: string | null;
  nationality: string | null;
  idCardNumber: string | null;
  passportNumber: string | null;
  preferredLanguage: 'vi' | 'en';
  preferredCurrency: 'VND' | 'USD';
  marketingOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Response của `GET /users/me` (User đã bỏ passwordHash, kèm quan hệ profile). */
export interface MyProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  profile: UserProfileRaw | null;
}

/** Body của `PATCH /users/me` — chỉ các field self-service (không email/role/status). */
export interface UpdateMyProfileDto {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  idCardNumber?: string | null;
  passportNumber?: string | null;
  preferredLanguage?: 'vi' | 'en';
  preferredCurrency?: 'VND' | 'USD';
  marketingOptIn?: boolean;
}

// ----- Loyalty -----
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type LoyaltyTxType = 'earn' | 'redeem' | 'expire' | 'adjustment';

export interface LoyaltyTransaction {
  id: string;
  type: LoyaltyTxType;
  points: number;
  description?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

export interface LoyaltyAccount {
  totalPoints: number;
  tier: LoyaltyTier;
  transactions: LoyaltyTransaction[];
}

// ----- Notifications -----
export type NotificationType =
  | 'booking_confirmed'
  | 'payment_success'
  | 'check_in_reminder'
  | 'review_request'
  | 'alert'
  | 'promotion'
  | 'partner_approved';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

// ----- Reviews -----
export type ReviewStatus = 'pending' | 'published' | 'hidden';

export interface ReviewItem {
  id: string;
  hotelName: string;
  bookingCode: string;
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title?: string;
  content: string;
  images: string[];
  managerResponse?: string | null;
  status: ReviewStatus;
  createdAt: string;
}

/** Shape thô 1 review trả về từ `GET /reviews/me` (Decimal đã serialize thành string). */
export interface MyReviewRaw {
  id: string;
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title: string | null;
  content: string;
  managerResponse: string | null;
  status: ReviewStatus;
  createdAt: string;
  hotel: { id: string; name: string };
  booking: { bookingCode: string };
  images: { url: string }[];
}


// ----- Promotions / Vouchers -----
export type DiscountType = 'percentage' | 'fixed_amount' | 'free_night';

export interface PromotionItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minNights?: number;
  endDate: string;
}
