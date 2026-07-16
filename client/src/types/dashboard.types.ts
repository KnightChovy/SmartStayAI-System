/**
 * Types cho Manager Dashboard (`/manager/dashboard`).
 *
 * Đây là lớp VIEW-MODEL: các hook trong `hooks/dashboard/` gộp nhiều API THẬT
 * (`/admin/revenue`, `/admin/overview`, `/admin/audit-logs`, `/platform-manager/*`,
 * `/hotel-partners/registrations`) rồi quy về shape dưới đây cho component dùng.
 *
 * Tiền: BE trả Decimal dạng **string**; hook convert sang `number` (VND) ngay ở biên
 * để component không phải xử lý — VND nằm thừa trong khoảng an toàn của f64.
 */
import type { VerificationStatus } from '@/types/hotel-verify.types';

export type { VerificationStatus };

export interface DashboardRange {
  from: string;
  to: string;
}

export type DashboardRangeParams = DashboardRange;

/**
 * Một KPI. `changePct`/`sparkline` có thể rỗng: BE chỉ có so sánh kỳ trước + chuỗi thời gian
 * cho TIỀN và BOOKING. Số người dùng và số đối tác chỉ có snapshot toàn thời gian
 * ⇒ `changePct: null`, `sparkline: []`, kèm `note` để UI nói rõ với người xem.
 */
export interface DashboardKpi {
  value: number;
  /** `null` = BE không có nguồn so sánh (badge hiện "—"). */
  changePct: number | null;
  /** `[]` = không có chuỗi thời gian để vẽ. */
  sparkline: number[];
  /** Chú thích khi con số KHÔNG theo khoảng thời gian đang chọn (vd "All time"). */
  note?: string;
}

export interface DashboardSummary {
  range: DashboardRange;
  previousRange: DashboardRange;
  kpis: {
    hotelPartners: DashboardKpi;
    activeUsers: DashboardKpi;
    bookings: DashboardKpi;
    revenue: DashboardKpi;
  };
}

/**
 * Chuỗi doanh thu + booking theo khoảng đang chọn (`GET /admin/revenue`).
 *
 * Phân biệt hai loại tiền — gộp chung là sai lệch nghiêm trọng:
 *  • `gmv`        — tổng tiền khách trả, tức doanh thu của CÁC KHÁCH SẠN.
 *  • `netRevenue` — hoa hồng platform thực thu, tức doanh thu của CHÍNH SÀN.
 */
export interface DashboardTimePoint {
  period: string;
  gmv: number;
  netRevenue: number;
  bookings: number;
}

export interface DashboardTimeSeries {
  groupBy: 'day' | 'month';
  points: DashboardTimePoint[];
}

/**
 * Chuỗi người dùng MỚI (`GET /platform-manager/analytics`).
 * Tách khỏi `DashboardTimeSeries` vì endpoint này KHÔNG nhận from/to — chỉ nhận số bucket
 * lùi về từ hiện tại, nên nó không đi theo date-range picker của dashboard.
 */
export interface UsersGrowthPoint {
  period: string;
  newUsers: number;
}

export interface UsersGrowthSeries {
  points: UsersGrowthPoint[];
}

export interface DashboardVerification {
  id: string;
  hotelId: string;
  hotelName: string;
  partnerName: string;
  submittedAt: string;
  status: VerificationStatus;
}

export type AlertSeverity = 'high' | 'medium' | 'low';

/** Cảnh báo suy ra CLIENT-SIDE từ `GET /platform-manager/performance` (BE không có API alert). */
export interface DashboardAlert {
  id: string;
  hotelId: string;
  hotelName: string;
  issue: string;
  severity: AlertSeverity;
}

/** Top khách sạn theo SỐ BOOKING — BE không có doanh thu per-hotel ở phạm vi toàn sàn. */
export interface TopHotel {
  hotelId: string;
  name: string;
  bookings: number;
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
}

export interface DashboardSearchResults {
  hotels: { id: string; name: string; city: string }[];
  users: { id: string; name: string; email: string }[];
  bookings: { id: string; code: string; hotelName: string }[];
}
