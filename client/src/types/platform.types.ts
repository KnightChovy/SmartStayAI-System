/** Số liệu tổng của sàn (`GET /v1/platform/stats`) — SS-002/004. */
export interface PlatformStats {
  totalHotels: number;
  totalCities: number;
  /** Thang 5, 1 chữ số; null khi chưa có review. */
  avgRating: number | null;
  totalReviews: number;
}

/** Testimonial nổi bật (`GET /v1/reviews/featured`) — SS-004. */
export interface FeaturedReview {
  id: string;
  content: string;
  overallRating: number;
  /** Tên khách đã viết tắt (vd "Nguyễn V."). */
  customerName: string;
  avatarUrl: string | null;
  hotelName: string;
  hotelCity: string;
  createdAt: string;
}

export interface FeaturedReviewsParams {
  limit?: number;
}
