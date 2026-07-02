import axios from 'axios';
import type {
  VietmapSuggestion,
  VietmapPlaceDetail,
} from '@/types/vietnam-geo.types';

const searchKey = () =>
  import.meta.env.VITE_API_SEARCH_KEY as string | undefined;

// Proxied through Vite dev server (/api/vietmap → https://maps.vietmap.vn/api)
// In production this should be proxied via backend to avoid CORS + key exposure.
const vietmapProxy = axios.create({ baseURL: '/api/vietmap' });

export async function autocompleteAddress(
  text: string
): Promise<VietmapSuggestion[]> {
  const key = searchKey();
  if (!key || text.trim().length < 2) return [];
  try {
    const { data } = await vietmapProxy.get<VietmapSuggestion[]>(
      '/autocomplete/v4',
      {
        params: { apikey: key, text: text.trim() },
      }
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getPlaceDetail(
  refId: string
): Promise<VietmapPlaceDetail | null> {
  const key = searchKey();
  if (!key || !refId) return null;
  try {
    const { data } = await vietmapProxy.get<VietmapPlaceDetail>('/place/v3', {
      params: { apikey: key, refid: refId },
    });
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Suy toạ độ từ địa chỉ tự do: lấy gợi ý autocomplete đầu tiên; nếu thiếu toạ độ
 * thì lấy chi tiết qua place detail theo `ref_id`. Trả null nếu không có kết quả.
 * Dùng để hiện bản đồ khi `Hotel.latitude/longitude` chưa có trong DB.
 */
export async function geocodeAddress(
  text: string
): Promise<{ lat: number; lng: number } | null> {
  const suggestions = await autocompleteAddress(text);
  const first = suggestions[0];
  if (!first) return null;
  if (first.lat && first.lng) return { lat: first.lat, lng: first.lng };

  const detail = await getPlaceDetail(first.ref_id);
  if (detail?.lat && detail?.lng) return { lat: detail.lat, lng: detail.lng };
  return null;
}

export function parseVietmapDisplay(display: string): {
  province: string;
  ward: string;
} {
  const parts = display
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  const province = parts[parts.length - 1] ?? '';
  const wardPrefixes = ['Phường', 'Xã', 'Thị trấn', 'Thị xã'];
  let ward = '';
  for (let i = parts.length - 2; i >= 0; i--) {
    if (wardPrefixes.some(pre => parts[i].startsWith(pre))) {
      ward = parts[i];
      break;
    }
  }
  return { province, ward };
}
