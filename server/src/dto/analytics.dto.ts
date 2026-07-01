/** Query cho báo cáo analytics toàn sàn (Platform Manager). */
export interface AnalyticsQuery {
  /** Đơn vị chia cột thời gian cho time-series. Mặc định 'month'. */
  period?: 'month' | 'year';
  /** Số kỳ gần nhất hiển thị trong time-series (vd 12 tháng / 5 năm). */
  range?: number;
  /** Số phần tử tối đa cho top thành phố / top khách sạn. */
  topLimit?: number;
}

/** Khoảng thời gian cho báo cáo performance (mặc định 90 ngày gần nhất). */
export interface PerformanceQuery {
  from?: string | Date;
  to?: string | Date;
}
