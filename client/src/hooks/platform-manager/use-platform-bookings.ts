import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { platformManagerKeys } from '@/hooks/platform-manager/keys';
import { platformManagerService } from '@/services/platform-manager.service';
import type { PlatformBookingsParams } from '@/types/platform-manager.types';

export function usePlatformBookings(params: PlatformBookingsParams = {}) {
  return useQuery({
    queryKey: platformManagerKeys.bookings(params),
    queryFn: () => platformManagerService.listBookings(params),
    placeholderData: keepPreviousData,
  });
}
