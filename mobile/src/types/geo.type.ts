/**
 * Type cho geocoding qua VietMap (autocomplete + place detail).
 * Dùng để suy ra toạ độ từ địa chỉ khách sạn khi DB chưa có `latitude/longitude`.
 */

export interface VietmapSuggestion {
  ref_id: string;
  display: string;
  name: string;
  address: string;
  /** Autocomplete có thể trả 0/null → cần gọi place detail. */
  lat: number;
  lng: number;
}

export interface VietmapPlaceDetail {
  ref_id: string;
  display: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}
