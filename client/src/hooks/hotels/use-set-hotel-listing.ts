import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * `PATCH /hotels/:id/publish` — partner bật/tắt mở bán khách sạn của mình.
 * Sau khi thành công, làm mới danh sách KS của partner và chi tiết quản lý của KS đó.
 */
export function useSetHotelListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, isListed }: { hotelId: string; isListed: boolean }) =>
      hotelService.setListing(hotelId, isListed),
    onSuccess: (_data, { hotelId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.managed(hotelId) });
    },
  });
}
