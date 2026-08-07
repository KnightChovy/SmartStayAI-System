import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * 5 preset chính sách huỷ của BE (`GET /hotels/cancellation-presets`).
 *
 * Dữ liệu tham chiếu tĩnh (BE khai bằng hằng số trong mã) ⇒ `staleTime: Infinity`, không tải lại.
 */
export function useCancellationPresets() {
  return useQuery({
    queryKey: queryKeys.hotels.cancellationPresets,
    queryFn: hotelService.getCancellationPresets,
    staleTime: Infinity,
  });
}
