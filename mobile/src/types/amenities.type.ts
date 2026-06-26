/** Type danh mục tiện nghi — model theo backend (`GET /v1/amenities`). */

export type AmenityCategory = 'room' | 'hotel' | 'service';

export interface Amenity {
  id: string;
  name: string;
  icon?: string | null;
  category: AmenityCategory;
}

/** Query của `GET /amenities` (lọc theo category, tùy chọn). */
export interface AmenityParams {
  category?: AmenityCategory;
}
