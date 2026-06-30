import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { amenitiesService } from '@/services/amenities.service';
import type { AmenityParams } from '@/types/amenities.type';

/** `GET /amenities` — danh sách tiện nghi (lọc category tuỳ chọn). Public. */
export function useGetAmenities(params: AmenityParams = {}) {
  return useQuery({
    queryKey: queryKeys.amenities.list(params),
    queryFn: () => amenitiesService.getAll(params),
    staleTime: 30 * 60 * 1000, // danh mục ít đổi → cache lâu
  });
}
