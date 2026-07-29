import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { destinationService } from '@/services/destination.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * Gợi ý điểm đến (`GET /v1/destinations/suggest?q=`) — SS-001.
 * Chỉ chạy khi `q` ≥ 1 ký tự (khớp ràng buộc BE). Giữ data cũ khi gõ tiếp cho mượt.
 */
export function useDestinationSuggest(q: string, limit = 8) {
  const query = q.trim();
  return useQuery({
    queryKey: queryKeys.destinations.suggest({ q: query, limit }),
    queryFn: () => destinationService.suggest({ q: query, limit }),
    enabled: query.length >= 1,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}
