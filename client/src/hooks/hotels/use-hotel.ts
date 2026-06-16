import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';
import type { HotelSearchResult } from '@/types/hotel.types';

/**
 * Lấy thông tin khách sạn theo id (fallback search vì backend chưa có
 * endpoint riêng). `initialData` cho phép truyền dữ liệu sẵn từ router state
 * để không phải gọi lại khi điều hướng từ trang search.
 */
export function useHotel(hotelId: string, initialData?: HotelSearchResult | null) {
  return useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelService.getById(hotelId),
    enabled: !!hotelId,
    initialData: initialData ?? undefined,
  });
}
