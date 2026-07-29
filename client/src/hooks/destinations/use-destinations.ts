import { useQuery } from '@tanstack/react-query';
import { destinationService } from '@/services/destination.service';
import { queryKeys } from '@/constants/queryKeys';

/** Danh sách điểm đến kèm số khách sạn thật (`GET /v1/destinations`) — SS-601. */
export function useDestinations() {
  return useQuery({
    queryKey: queryKeys.destinations.list,
    queryFn: () => destinationService.list(),
    staleTime: 5 * 60 * 1000,
  });
}
