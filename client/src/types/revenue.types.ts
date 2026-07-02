/**
 * Types cho trang Platform Revenue (`/manager/revenue`).
 * Khớp contract API đề xuất trong `docs/revenue-api-spec.md` (BE sẽ implement sau; hiện FE dùng mock).
 * Tiền để dạng string (Decimal-safe), rate/percent để number.
 */

export type PartnerStatus = 'active' | 'inactive' | 'suspended';

/** Khoảng thời gian (inclusive), dạng YYYY-MM-DD. */
export interface DateRange {
  from: string;
  to: string;
}

/** Query dùng chung cho các endpoint revenue. */
export interface RevenueRangeParams {
  from: string;
  to: string;
}

// ===== 1. Summary (KPI cards) =====

/** Một KPI kèm giá trị kỳ trước + % thay đổi. */
export interface RevenueKpi<TValue extends string | number = string> {
  value: TValue;
  previous: TValue;
  /** % thay đổi so kỳ trước; null nếu kỳ trước = 0. */
  changePct: number | null;
}

export interface RevenueSummary {
  range: DateRange;
  previousRange: DateRange;
  kpis: {
    grossRevenue: RevenueKpi<string>;
    totalCommission: RevenueKpi<string>;
    avgCommissionRate: RevenueKpi<number>;
    avgRevenuePerPartner: RevenueKpi<string>;
  };
}

// ===== 2. Time-series (Revenue vs Commission / vs Target) =====

export type RevenueBucket = 'day' | 'month' | 'quarter' | 'year';

export interface RevenueTimePoint {
  period: string;
  revenue: string;
  commission: string;
  /** null nếu kỳ đó chưa đặt target. */
  target: string | null;
  /** Chỉ có khi compare=true — doanh thu kỳ trước tương ứng để overlay. */
  previousRevenue?: string;
}

export interface RevenueTimeSeriesParams extends RevenueRangeParams {
  bucket?: RevenueBucket;
  compare?: boolean;
}

export interface RevenueTimeSeries {
  bucket: RevenueBucket;
  points: RevenueTimePoint[];
}

// ===== 3. By-partner table =====

export interface RevenuePartnerRow {
  partnerId: string;
  hotelId: string | null;
  hotelName: string;
  bookings: number;
  grossRevenue: string;
  commission: string;
  commissionRate: number;
  /** % thay đổi gross revenue so kỳ trước; null nếu kỳ trước = 0. */
  changePct: number | null;
  status: PartnerStatus;
}

export interface RevenueByPartnerParams extends RevenueRangeParams {
  search?: string;
  status?: PartnerStatus;
  /** vd 'grossRevenue:desc'. */
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface RevenueByPartnerResponse {
  results: RevenuePartnerRow[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

// ===== 4. Breakdown (P2) =====

export interface RevenueBreakdownSegment {
  label: string;
  revenue: string;
  /** % tỷ trọng (number). */
  share: number;
}

export interface RevenueBreakdownParams extends RevenueRangeParams {
  by?: 'city' | 'businessType';
}

export interface RevenueBreakdown {
  by: 'city' | 'businessType';
  segments: RevenueBreakdownSegment[];
}
