import axios from 'axios';
import type { Coordinates, VietmapPlaceDetail, VietmapSuggestion } from '@/types/geo.type';

/**
 * Tầng gọi VietMap geocoding (KHÁC backend `/v1`). Trên native không vướng CORS nên
 * gọi trực tiếp `maps.vietmap.vn`. Key lấy từ `EXPO_PUBLIC_API_SEARCH_KEY`.
 */
const SEARCH_KEY = process.env.EXPO_PUBLIC_API_SEARCH_KEY ?? '';
const vietmap = axios.create({ baseURL: 'https://maps.vietmap.vn/api', timeout: 10000 });

export const geoService = {
  /**
   * Suy toạ độ từ địa chỉ tự do: autocomplete lấy gợi ý đầu tiên; nếu thiếu toạ độ
   * thì lấy chi tiết qua place detail theo `ref_id`. Trả null nếu không có key/không ra kết quả.
   */
  async geocode(text: string): Promise<Coordinates | null> {
    const query = text.trim();
    if (!SEARCH_KEY || query.length < 2) return null;
    try {
      const { data } = await vietmap.get<VietmapSuggestion[]>('/autocomplete/v4', {
        params: { apikey: SEARCH_KEY, text: query },
      });
      const first = Array.isArray(data) ? data[0] : undefined;
      if (!first) return null;
      if (first.lat && first.lng) return { lat: first.lat, lng: first.lng };

      const { data: detail } = await vietmap.get<VietmapPlaceDetail>('/place/v3', {
        params: { apikey: SEARCH_KEY, refid: first.ref_id },
      });
      if (detail?.lat && detail?.lng) return { lat: detail.lat, lng: detail.lng };
      return null;
    } catch {
      return null;
    }
  },
};
