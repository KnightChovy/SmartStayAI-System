import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';
import type { HotelDetail, HotelSearchResult } from '@/types/hotel.types';

/**
 * Chi tiết khách sạn (`GET /hotels/:id`, public) — kèm tiện nghi / chính sách / địa điểm lân cận.
 *
 * `seed` là bản tóm tắt sẵn có từ router state (trang search) — dùng làm `placeholderData` để
 * header hiện ngay, KHÔNG dùng `initialData` (sẽ khiến query coi như đã fresh và không bao giờ
 * gọi API chi tiết, mất tiện nghi/chính sách).
 */
export function useHotel(hotelId: string, seed?: HotelSearchResult | null) {
  return useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelService.getById(hotelId),
    enabled: !!hotelId,
    placeholderData: seed
      ? ({ ...seed, amenities: [], policies: [], nearbyPlaces: [] } satisfies HotelDetail)
      : undefined,
  });
}
