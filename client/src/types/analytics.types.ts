export interface PlatformAnalyticsParams {
  period?: 'month' | 'year';

  range?: number;

  topLimit?: number;
}

export interface PlatformAnalyticsTotals {
  totalBookings: number;
  confirmedBookings: number;

  conversionRate: number;
  totalUsers: number;
}

export interface PlatformAnalyticsTimePoint {
  period: string;
  bookings: number;
  confirmedBookings: number;
  newUsers: number;
}

export interface PlatformAnalyticsTopCity {
  city: string;
  bookings: number;
}

export interface PlatformAnalyticsTopHotel {
  hotelId: string;
  name: string;
  bookings: number;
}

export interface PlatformAnalytics {
  totals: PlatformAnalyticsTotals;
  period: 'month' | 'year';
  range: number;
  timeSeries: PlatformAnalyticsTimePoint[];
  topCities: PlatformAnalyticsTopCity[];
  topHotels: PlatformAnalyticsTopHotel[];
}
