/**
 * Types cho Manager Dashboard (`/manager/dashboard`).
 * Hiện FE dùng mock (`services/dashboard.service.ts`); shape thiết kế theo contract API tương lai
 * để sau này swap mock → thật chỉ cần đổi thân service. Tiền để dạng number (VND) cho gọn ở dashboard.
 */

export interface DashboardRange {
  from: string;
  to: string;
}

export type DashboardRangeParams = DashboardRange;

/** Một KPI kèm giá trị kỳ trước, % thay đổi và sparkline xu hướng ngắn hạn. */
export interface DashboardKpi {
  value: number;
  previous: number;
  changePct: number | null;
  sparkline: number[];
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

export interface DashboardTimePoint {
  period: string;
  revenue: number;
  bookings: number;
  activeUsers: number;
}

export interface DashboardTimeSeries {
  points: DashboardTimePoint[];
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface DashboardVerification {
  id: string;
  code: string;
  hotelId: string;
  hotelName: string;
  submittedAt: string;
  status: VerificationStatus;
}

export type AlertSeverity = 'high' | 'medium' | 'low';

export interface DashboardAlert {
  id: string;
  hotelId: string;
  hotelName: string;
  issue: string;
  severity: AlertSeverity;
}

export interface TopHotel {
  hotelId: string;
  name: string;
  revenue: number;
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
