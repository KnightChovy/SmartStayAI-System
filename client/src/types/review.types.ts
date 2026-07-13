/** Đánh giá công khai của một khách sạn (`GET /reviews?hotelId=`). */
export interface PublicReviewCustomer {
  id: string;
  fullName: string;
}

export interface PublicReviewImage {
  id: string;
  url: string;
}

export interface PublicReview {
  id: string;
  hotelId: string;
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title: string | null;
  content: string;
  status: string;
  createdAt: string;
  customer: PublicReviewCustomer;
  images: PublicReviewImage[];
}

/** Tham số list đánh giá public. `hotelId` bắt buộc theo validation BE. */
export interface PublicReviewsParams {
  hotelId: string;
  limit?: number;
  page?: number;
  sortBy?: string;
}
