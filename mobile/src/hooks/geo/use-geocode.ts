import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { geoService } from '@/services/geo.service';

/**
 * Suy toạ độ từ địa chỉ (VietMap). Chỉ chạy khi `enabled` (vd hotel chưa có lat/lng).
 * Kết quả gần như tĩnh theo địa chỉ → cache lâu.
 */
export function useGeocode(address: string | undefined, enabled = true) {
  const query = (address ?? '').trim();
  return useQuery({
    queryKey: queryKeys.geo.geocode(query),
    queryFn: () => geoService.geocode(query),
    enabled: enabled && query.length >= 2,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    retry: 1,
  });
}
