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
  /**
   * Bản tóm tắt + các relation rỗng, để header hiện ngay trong lúc chờ chi tiết.
   *
   * ⚠️ Các mảng rỗng ở đây là BỊA (seed không hề có chúng), nên nơi nào đọc `policies`/`charges`
   * PHẢI kiểm `isPlaceholderData` trước — coi `charges: []` là thật sẽ báo "không thuế" cho
   * khách sạn có VAT. Đừng bỏ mảng rỗng đi để "cho an toàn": thiếu field thì type vỡ.
   */
  const placeholder: HotelDetail | undefined = seed
    ? { ...seed, amenities: [], policies: [], charges: [], nearbyPlaces: [], contacts: [] }
    : undefined;

  return useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelService.getById(hotelId),
    enabled: !!hotelId,
    placeholderData: placeholder,
  });
}
