/**
 * Types cho trang Platform Revenue (`/manager/revenue`).
 *
 * Nguồn dữ liệu THẬT: `GET /admin/revenue` — endpoint duy nhất BE có cho doanh thu toàn sàn.
 * Nó dùng permission `viewPlatformStats`, mà role `platform_manager` có sẵn quyền này
 * (`server/src/config/roles.ts`), nên manager gọi được dù đường dẫn mang tiền tố `/admin`.
 *
 * Những khối KHÔNG có nguồn (target theo kỳ, doanh thu theo từng đối tác, chia theo khu vực)
 * đã gỡ khỏi trang thay vì hiển thị số giả — spec cho BE nằm ở `docs/revenue-api-spec.md`.
 *
 * Tiền để dạng string (Decimal-safe), rate/percent để number.
 */

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

/** Một KPI kèm % thay đổi so kỳ trước. */
export interface RevenueKpi<TValue extends string | number = string> {
  value: TValue;
  /** % thay đổi so kỳ trước; null khi BE không trả kỳ trước hoặc kỳ trước = 0. */
  changePct: number | null;
}

export interface RevenueSummary {
  range: DateRange;
  previousRange: DateRange;
  kpis: {
    /** GMV — tổng giá trị booking confirmed / checked-in / checked-out. */
    grossRevenue: RevenueKpi<string>;
    /** Hoa hồng ghi nhận = pending + settled (disputed không tính). */
    totalCommission: RevenueKpi<string>;
    avgCommissionRate: RevenueKpi<number>;
    bookings: RevenueKpi<number>;
  };
  /** Tách hoa hồng theo trạng thái + tiền hoàn (BE trả sẵn trong `summary`). */
  commissionPending: string;
  commissionSettled: string;
  refunded: string;
}

// ===== 2. Time-series (Revenue vs Commission) =====

/** Khớp `groupBy` mà BE hỗ trợ. */
export type RevenueBucket = 'day' | 'month';

export interface RevenueTimePoint {
  period: string;
  revenue: string;
  commission: string;
  bookings: number;
  /** Chỉ có khi compare=true — doanh thu kỳ trước tương ứng để overlay. */
  previousRevenue?: string;
}

export interface RevenueTimeSeriesParams extends RevenueRangeParams {
  compare?: boolean;
}

export interface RevenueTimeSeries {
  bucket: RevenueBucket;
  points: RevenueTimePoint[];
}
