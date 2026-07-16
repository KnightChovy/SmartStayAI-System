/** Type cho đánh giá khách sạn — model theo backend (`/v1/reviews`). */

export interface ReviewImage {
  id: string;
  reviewId: string;
  url: string;
  uploadedAt?: string | null;
}

export interface ReviewCustomer {
  id: string;
  fullName: string;
}

/** Đánh giá trả về từ backend (kèm người viết + ảnh). */
export interface Review {
  id: string;
  bookingId: string;
  hotelId: string;
  customerId: string;
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title?: string | null;
  content: string;
  managerResponse?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: ReviewCustomer;
  images: ReviewImage[];
}

/** Trạng thái kiểm duyệt — `GET /reviews?hotelId=` chỉ trả `published`, `/reviews/me` trả cả 3. */
export type ReviewStatus = 'pending' | 'published' | 'hidden';

/**
 * Đánh giá của chính mình (`GET /reviews/me`, `PATCH /reviews/:id`).
 * Include KHÁC bản công khai: có `hotel` + `booking`, KHÔNG có `customer` (biết là mình rồi).
 */
export interface MyReview extends Omit<Review, 'customer'> {
  status: ReviewStatus;
  hotel?: { id: string; name: string };
  booking?: { bookingCode: string };
}

/** Payload `POST /reviews` — khách viết đánh giá sau khi trả phòng. */
export interface CreateReviewPayload {
  bookingId: string;
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title?: string | null;
  content: string;
  images?: string[];
}

/**
 * Payload `PATCH /reviews/:reviewId` — mọi field optional nhưng BE bắt buộc ≥1 key.
 * ⚠️ Gửi `images` (kể cả `[]`) là THAY TOÀN BỘ ảnh cũ, không phải thêm vào.
 */
export interface UpdateReviewPayload {
  overallRating?: number;
  cleanlinessRating?: number;
  serviceRating?: number;
  locationRating?: number;
  valueRating?: number;
  title?: string | null;
  content?: string;
  images?: string[];
}

/**
 * Thống kê đánh giá công khai (`GET /hotels/:hotelId/review-stats`).
 * Chỉ tính review đã `published`. `average.*` là `null` khi chưa có đánh giá nào.
 */
export interface ReviewStats {
  total: number;
  average: {
    overall: number | null;
    cleanliness: number | null;
    service: number | null;
    location: number | null;
    value: number | null;
  };
  /** Phân bố số lượng theo mức sao 1..5 (đã điền 0 cho mức chưa có). */
  countByStar: Record<number, number>;
}

/** Query của `GET /reviews?hotelId=...` — đánh giá công khai của một khách sạn. */
export interface HotelReviewsParams {
  hotelId: string;
  sortBy?: string;
  page?: number;
  /** BE chặn tối đa 100. */
  limit?: number;
}

/** Query của `GET /reviews/me`. */
export interface MyReviewsParams {
  sortBy?: string;
  page?: number;
  limit?: number;
}
