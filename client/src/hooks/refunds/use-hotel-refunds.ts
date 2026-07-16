import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { refundKeys } from '@/hooks/refunds/keys';
import { refundService } from '@/services/refund.service';
import type { HotelRefundsParams } from '@/types/refund.types';

/** `GET /hotels/:hotelId/refunds` — hàng đợi duyệt hoàn tiền của một khách sạn. */
export function useHotelRefunds(hotelId: string, params: HotelRefundsParams = {}) {
  return useQuery({
    queryKey: refundKeys.hotel(hotelId, params),
    queryFn: () => refundService.listHotelRefunds(hotelId, params),
    enabled: !!hotelId,
    // Giữ data cũ khi đổi trang/filter để bảng không nhảy layout.
    placeholderData: keepPreviousData,
  });
}
