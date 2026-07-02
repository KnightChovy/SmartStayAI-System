import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { geocodeAddress } from '@/services/vietnam-geo.service';

/**
 * Suy toạ độ từ địa chỉ (VietMap). Chỉ chạy khi `enabled` (vd hotel chưa có lat/lng trong DB).
 * Kết quả gần như tĩnh theo địa chỉ → cache lâu.
 */
export function useGeocode(address: string | undefined, enabled = true) {
  const query = (address ?? '').trim();
  return useQuery({
    queryKey: queryKeys.geo.geocode(query),
    queryFn: () => geocodeAddress(query),
    enabled: enabled && query.length >= 2,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    retry: 1,
  });
}
