import type { ElementType, ReactNode } from 'react';
import type { UserRole } from '@/constants/roles';
import type { Paginated } from '@/types/api.types';
import type { HotelImage } from '@/types/hotel.types';
import type {
  HotelBooking,
  PaymentMethod,
  PaymentStatus,
} from '@/types/staff.types';

export interface AdminNavbarProps {
  searchPlaceholder: string;
}

export interface AdminAnalyticsHeaderProps {
  title: string;
  description: string;
  onExport?: () => void;
  isExporting?: boolean;
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
  /** Icon lucide trong ô màu, khớp KPI card của manager. */
  icon?: ElementType;
}

export interface AdminPropertiesTableProps {
  rows: string[][];
}

export interface AdminUsersTableProps {
  users: AdminUser[];
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  isDeleting?: boolean;
  pagination?: ReactNode;
}

export interface AdminPageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
  /** Icon lucide hiển thị trong ô màu bên trái, khớp cách manager/partner làm header. */
  icon?: ElementType;
}

export interface AdminTableProps {
  headers: string[];
  rows: string[][];
  renderLastColumn?: (row: string[]) => ReactNode;
  footer?: ReactNode;
  showStatusIcons?: boolean;
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
  status?: AdminUserStatus;
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

export interface AdminUpdateUserStatusPayload {
  status: AdminUserStatus;
}

export interface AdminUpdateUserRolePayload {
  role: UserRole;
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

export interface AdminOverview {
  users: {
    total: number;
    byRole: Record<string, number>;
    suspended: number;
    newThisMonth: number;
  };
  hotels: {
    total: number;
    listed: number;
    unlisted: number;
  };
  bookings: {
    total: number;
    byStatus: Record<string, number>;
    thisMonth: number;
  };
  revenue: {
    gmv: string;
    commissionPending: string;
    commissionSettled: string;
    refundedTotal: string;
  };
}

export interface AdminRevenueParams {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'month';
}

export interface AdminRevenueSummary {
  gmv: string;
  commissionPending: string;
  commissionSettled: string;
  /**
   * Hoa hồng đang tranh chấp. **KHÔNG** nằm trong `netPlatformRevenue` — cộng vào là thổi
   * phồng doanh thu sàn. Trước đây BE không trả nên tiền này biến mất khỏi mọi báo cáo.
   */
  commissionDisputed: string;
  refunded: string;
  netPlatformRevenue: string;
  bookingCount: number;
  /**
   * `netPlatformRevenue / gmv × 100` (đã làm tròn 2 chữ số ở BE).
   * `null` = **chưa có GMV để chia**, không phải 0 ⇒ UI hiện `—`, đừng hiện `0%`.
   */
  takeRatePct: number | null;
  /** `gmv / bookingCount`. `null` = chưa có booking nào (khác "bằng không"). */
  avgBookingValue: string | null;
}

export interface AdminRevenueSeriesPoint {
  period: string;
  gmv: string;
  commission: string;
  netPlatformRevenue: string;
  bookingCount: number;
}

export interface AdminRevenueComparison {
  previous: {
    gmv: string;
    netPlatformRevenue: string;
  };
  change: {
    gmvPct: number | null;
    netRevenuePct: number | null;
  };
}

export interface AdminPlatformRevenue {
  /** Luôn `"VND"` — nằm ở TOP-LEVEL vì áp cho mọi số tiền trong response. */
  currency: string;
  /** ISO — thời điểm BE chốt số, để hiện "Số liệu tính đến …". */
  asOf: string;
  summary: AdminRevenueSummary;
  groupBy: 'day' | 'month';
  series: AdminRevenueSeriesPoint[];
  comparison: AdminRevenueComparison | null;
}

// ===== Revenue breakdown (GET /admin/revenue/breakdown) =====

/**
 * Drill-down của `/admin/revenue` (endpoint kia chỉ cho TỔNG toàn sàn).
 * Cùng mốc ghi nhận: `gmv` + `commission` theo NGÀY THANH TOÁN (`commission.createdAt`),
 * `refunded` theo NGÀY TẠO yêu cầu hoàn — nên tổng mọi nhóm ở đây **bằng đúng** số tổng
 * của `/admin/revenue` trong cùng khoảng, dùng làm mẫu số tính tỷ trọng được.
 *
 * `commission` đã LOẠI các khoản `disputed` (là doanh thu thật của sàn cho nhóm đó).
 */
export type RevenueBreakdownGroupBy = 'partner' | 'hotel' | 'city';
export type RevenueBreakdownSortBy = 'commission' | 'gmv' | 'bookingCount';

export interface AdminRevenueBreakdownParams {
  /** Bắt buộc — backend không có giá trị mặc định. */
  groupBy: RevenueBreakdownGroupBy;
  /** YYYY-MM-DD, bỏ trống = all-time. */
  from?: string;
  to?: string;
  /** Lọc drill-down: chỉ các khách sạn của 1 đối tác (dùng kèm `groupBy=hotel`). */
  partnerId?: string;
  /** Mặc định `commission`. Backend luôn sắp GIẢM DẦN, không có chiều tăng. */
  sortBy?: RevenueBreakdownSortBy;
  limit?: number;
  page?: number;
}

interface RevenueBreakdownMoney {
  gmv: string;
  commission: string;
  /**
   * % hoa hồng **bình quân gia quyền trong kỳ**, lấy thẳng từ mức đã đóng băng trong
   * `platform_commissions` lúc thanh toán. Luôn có giá trị (`"0"` khi nhóm không có doanh thu).
   *
   * ⚠️ KHÔNG tự tính bằng `commission / gmv`: khi có hoàn tiền, BE tính lại `commission` trên
   * phần khách sạn thực giữ nhưng `gmv` giữ nguyên ⇒ hai số khác mẫu số, chia ra ra sai
   * (15% thật hiện thành 11.3%). Vì lý do đó `gmv × commissionRatePct ≠ commission` là đúng
   * thiết kế, không phải bug.
   */
  commissionRatePct: string;
  refunded: string;
  bookingCount: number;
  /** Tỉ trọng doanh thu sàn của nhóm này, tính trên `totals.commission` (toàn bộ nhóm, không riêng trang). */
  sharePct: number;
}

export interface RevenueBreakdownPartnerRow extends RevenueBreakdownMoney {
  partnerId: string;
  name: string | null;
  hotelCount: number | null;
}

export interface RevenueBreakdownHotelRow extends RevenueBreakdownMoney {
  hotelId: string;
  name: string | null;
  city: string | null;
  partnerId: string | null;
  partnerName: string | null;
}

export interface RevenueBreakdownCityRow extends RevenueBreakdownMoney {
  city: string | null;
  hotelCount: number | null;
}

/** Hình dạng dòng ĐỔI theo `groupBy` — backend trả 3 shape khác nhau trên cùng một field. */
export type RevenueBreakdownRow =
  | RevenueBreakdownPartnerRow
  | RevenueBreakdownHotelRow
  | RevenueBreakdownCityRow;

/**
 * Type guard theo field có mặt, KHÔNG ép kiểu bằng `as` (quy ước 5.1).
 * Thứ tự kiểm quan trọng: dòng khách sạn **cũng có** `partnerId`, nên phải loại nó trước.
 */
export function isHotelRow(row: RevenueBreakdownRow): row is RevenueBreakdownHotelRow {
  return 'hotelId' in row;
}

export function isPartnerRow(row: RevenueBreakdownRow): row is RevenueBreakdownPartnerRow {
  return !isHotelRow(row) && 'partnerId' in row;
}

/**
 * Tổng của **TOÀN BỘ** nhóm trong kỳ, không phải riêng trang hiện tại ⇒ dùng làm mẫu số
 * tính tỉ trọng được. `refunded` chỉ cộng những nhóm CÓ xuất hiện trong `results` (nhóm chỉ
 * có hoàn tiền mà không có hoa hồng không thành dòng nào) để tổng luôn khớp tổng các dòng.
 */
export interface RevenueBreakdownTotals {
  gmv: string;
  commission: string;
  refunded: string;
  bookingCount: number;
}

export interface AdminRevenueBreakdown {
  groupBy: RevenueBreakdownGroupBy;
  /** Luôn `"VND"` — áp cho mọi số tiền trong response. */
  currency: string;
  /** ISO — thời điểm BE chốt số. */
  asOf: string;
  totals: RevenueBreakdownTotals;
  results: RevenueBreakdownRow[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export type AdminCommissionStatus = 'pending' | 'settled' | 'disputed';

export interface AdminCommissionsParams {
  status?: AdminCommissionStatus;
  partnerId?: string;
  limit?: number;
  page?: number;
}

export interface AdminCommission {
  id: string;
  bookingId: string;
  partnerId: string;
  paymentId: string;
  commissionRate: string;
  commissionAmount: string;
  status: AdminCommissionStatus;
  settledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  partner?: {
    id: string;
    businessName: string;
  };
  booking?: {
    bookingCode: string;
    totalAmount: string;
  };
}

export type AdminCommissionsResponse = Paginated<AdminCommission>;

export interface AdminHotelsParams {
  search?: string;
  isListed?: boolean;
  isActive?: boolean;
  limit?: number;
  page?: number;
}

export interface AdminManagedHotel {
  id: string;
  name: string;
  city: string;
  starRating?: number | null;
  isActive: boolean;
  isListed: boolean;
  createdAt: string;
  partner?: {
    id: string;
    businessName: string;
  };
}

export interface AdminUpdateHotelFlagsPayload {
  isListed?: boolean;
  isActive?: boolean;
}

export type AdminHotelsResponse = Paginated<AdminManagedHotel>;

export interface AdminAuditLogsParams {
  action?: string;
  entityType?: string;
  userId?: string;
  limit?: number;
  page?: number;
}

export interface AdminAuditUser {
  id: string;
  fullName?: string | null;
  email: string;
  role: UserRole;
}

export interface AdminAuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: AdminAuditUser;
}

export type AdminAuditLogsResponse = Paginated<AdminAuditLog>;

/** `status=unpaid` không phải trạng thái Payment thật — nghĩa là booking chưa từng có khoản thanh toán nào. */
export interface AdminPaymentsParams {
  status?: PaymentStatus | 'unpaid';
  paymentMethod?: PaymentMethod;
  hotelId?: string;
  limit?: number;
  page?: number;
}

export interface AdminPaymentBookingHotel {
  id: string;
  name: string;
}

export interface AdminPaymentBookingCustomer {
  id: string;
  fullName?: string | null;
  email: string;
}

export interface AdminPaymentTransaction {
  id: string;
  paymentMethod: PaymentMethod;
  transactionId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt: string;
}

/** Một dòng = 1 booking (luôn tồn tại), kèm khoản thanh toán mới nhất nếu có — `payment: null` nghĩa là
 * booking chưa từng có ai thanh toán (vd VNPay bị bỏ dở, chưa bấm thanh toán). */
export interface AdminPayment {
  id: string;
  bookingCode: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  hotel: AdminPaymentBookingHotel;
  customer: AdminPaymentBookingCustomer;
  payment: AdminPaymentTransaction | null;
}

export type AdminPaymentsResponse = Paginated<AdminPayment>;
