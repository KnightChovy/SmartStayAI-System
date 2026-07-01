/**
 * Payload khách viết đánh giá sau khi đã trả phòng. Các điểm đánh giá theo thang 1–5.
 * hotelId KHÔNG nhận từ client — server lấy từ booking để tránh gán nhầm khách sạn.
 */
export interface CreateReviewDto {
  bookingId: string;
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title?: string;
  content: string;
  // URL ảnh đã upload trước qua POST /v1/uploads (Cloudinary)
  images?: string[];
}

/** Bộ lọc khi liệt kê đánh giá công khai của một khách sạn. */
export interface ReviewFilter {
  hotelId: string;
}

/** Bộ lọc khi partner xem đánh giá của CHÍNH khách sạn mình (được lọc theo trạng thái). */
export interface PartnerReviewFilter {
  status?: 'pending' | 'published' | 'hidden';
}

/** Tuỳ chọn phân trang / sắp xếp khi liệt kê đánh giá. */
export interface ReviewQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}
