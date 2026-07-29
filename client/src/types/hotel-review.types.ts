/**
 * Types cho phần Reviews của cổng Hotel Partner (`/v1/hotels/:hotelId/reviews[...]`).
 * Khác `GET /reviews` public: partner xem được MỌI status và có stats tổng hợp.
 */
import type { Paginated } from '@/types/api.types';

export type HotelReviewStatus = 'pending' | 'published' | 'hidden';

export interface HotelReviewCustomer {
  id: string;
  fullName: string;
}

export interface HotelReviewImage {
  id: string;
  url: string;
  uploadedAt: string;
}

/** Một review của khách sạn (`GET /hotels/:id/reviews`). */
export interface HotelReview {
  id: string;
  bookingId: string;
  hotelId: string;
  customerId: string;
  customer: HotelReviewCustomer | null;
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title: string | null;
  content: string;
  status: HotelReviewStatus;
  images: HotelReviewImage[];
  createdAt: string;
}

export interface HotelReviewsParams {
  status?: HotelReviewStatus;
  sortBy?: string;
  limit?: number;
  page?: number;
}

/**
 * Params cho review CÔNG KHAI của 1 khách sạn (`GET /reviews?hotelId=`) — ai cũng xem được,
 * BE chỉ trả review `published`. Không có `status` (public luôn là published).
 */
export interface PublicReviewsParams {
  sortBy?: string;
  limit?: number;
  page?: number;
}

export type HotelReviewsResponse = Paginated<HotelReview>;

/** Thống kê tổng hợp review (`GET /hotels/:id/reviews/stats`, tính trên review đã published). */
/** Khoá phân bố điểm 1..10 (BE dùng thang 10 cho điểm đánh giá). */
export type ReviewScoreBucket =
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

export interface HotelReviewStats {
  total: number;
  /** Trung bình theo thang 10; null khi chưa có review. */
  average: {
    overall: number | null;
    cleanliness: number | null;
    service: number | null;
    location: number | null;
    value: number | null;
  };
  /** Số review published theo từng mức điểm overall (1..10). */
  countByStar: Record<ReviewScoreBucket, number>;
}
