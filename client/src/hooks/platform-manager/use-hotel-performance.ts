import { useQuery } from '@tanstack/react-query';

import { platformManagerKeys } from '@/hooks/platform-manager/keys';
import { platformManagerService } from '@/services/platform-manager.service';
import type { PerformanceQueryParams } from '@/types/platform-manager.types';

export function useHotelPerformance(
  hotelId: string | null,
  params: PerformanceQueryParams = {}
) {
  return useQuery({
    queryKey: platformManagerKeys.hotelPerformance(hotelId ?? '', params),
    queryFn: () =>
      platformManagerService.getHotelPerformance(hotelId as string, params),
    enabled: !!hotelId,
  });
}
