/** Cấu trúc phân trang chung backend trả về (search hotels, bookings/me, reviews...). */
export interface Paginated<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}
