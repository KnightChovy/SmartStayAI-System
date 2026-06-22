/**
 * Type cho các domain khu tài khoản. Model theo DB (`schema.prisma`) để khi
 * backend có API thật thì khớp shape sẵn. Hiện đang phục vụ mock.
 */

// ----- Profile (User + UserProfile) -----
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
  createdAt: string;
}

export interface CreateReviewInput {
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
