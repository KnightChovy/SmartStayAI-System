/** Deal công khai (`GET /v1/deals`) — SS-501. */
export interface Deal {
  promotionId: string;
  hotelId: string;
  hotelName: string;
  city: string;
  image: string | null;
  code: string;
  name: string;
  /** Decimal serialize thành string. */
  originalPrice: string;
  discountedPrice: string;
  discountPercent: number;
  /** `flash_sale` khi còn ≤48h tới hết hạn, else `standard`. */
  dealType: 'flash_sale' | 'standard';
  /** = promotion.endDate (ISO string qua JSON). */
  expiresAt: string;
}

/** Query cho `GET /v1/deals` (không phân trang; BE cắt theo `limit`). */
export interface DealsParams {
  limit?: number;
  city?: string;
}
