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

/** Query của `GET /reviews?hotelId=...` — đánh giá công khai của một khách sạn. */
export interface HotelReviewsParams {
  hotelId: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}
