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

/** Body của `PATCH /users/me/password`. */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ----- Notifications (`/v1/notifications`, khớp model Prisma `Notification`) -----
export type NotificationType =
  | 'booking_confirmed'
  | 'payment_success'
  | 'check_in_reminder'
  | 'review_request'
  | 'alert'
  | 'promotion'
  | 'partner_approved';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Payload tự do BE đính kèm (vd `{ bookingId }`). Không có schema cố định. */
  data?: unknown;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: string | null;
  /**
   * Mốc đã đọc. ⚠️ Đây là NGUỒN THẬT của trạng thái đọc — mọi query của BE lọc theo
   * `readAt: null`, không nhìn `status`. Đừng suy trạng thái đọc từ `status`.
   */
  readAt?: string | null;
  createdAt: string;
}

/** Query của `GET /v1/notifications`. */
export interface NotificationsParams {
  unreadOnly?: boolean;
  type?: NotificationType;
  sortBy?: string;
  limit?: number;
  page?: number;
}

/**
 * Response của `GET /v1/notifications` — phân trang chuẩn + `unreadCount`.
 * `unreadCount` là TỔNG chưa đọc của người dùng, BE cố tình tính bỏ qua bộ lọc
 * nên badge vẫn đúng kể cả khi đang xem danh sách đã lọc.
 */
export interface NotificationsResponse {
  results: AppNotification[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  unreadCount: number;
}

/** Response của `GET /v1/notifications/unread-count`. */
export interface UnreadCountResponse {
  unreadCount: number;
}

/** Response của `POST /v1/notifications/read-all` — số dòng vừa cập nhật (key là `updated`). */
export interface MarkAllReadResponse {
  updated: number;
}

// ----- Reviews -----
export type ReviewStatus = 'pending' | 'published' | 'hidden';

export interface ReviewItem {
  id: string;
  bookingId: string;
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
  bookingId: string;
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
