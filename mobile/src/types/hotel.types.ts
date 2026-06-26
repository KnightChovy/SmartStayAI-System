export interface HotelImage {
  url: string;
  isPrimary?: boolean | null;
}
export interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  starRating?: number | null;
  minPrice: string | null;
  images: HotelImage[];
}
export interface HotelSearchParams {
  city?: string;
  guests?: number;
  limit?: number;
  page?: number;
}
