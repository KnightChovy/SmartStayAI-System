/** Điểm đến (`GET /v1/destinations`) — SS-601. Sort nhiều KS nhất lên đầu. */
export interface Destination {
  city: string;
  hotelCount: number;
  image: string | null;
}

/** Gợi ý điểm đến (`GET /v1/destinations/suggest?q=`) — SS-001. */
export interface DestinationSuggestion {
  type: 'city' | 'district';
  name: string;
  city: string;
  hotelCount: number;
}

/** Query cho `GET /v1/destinations/suggest`. */
export interface DestinationSuggestParams {
  q: string;
  limit?: number;
}
