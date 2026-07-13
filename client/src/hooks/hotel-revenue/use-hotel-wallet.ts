import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { hotelRevenueKeys } from '@/hooks/hotel-revenue/keys';
import { hotelRevenueService } from '@/services/hotel-revenue.service';
import type { HotelWalletParams } from '@/types/hotel-revenue.types';

/** `GET /hotels/:id/wallet` — số dư ví + sổ giao dịch phân trang của 1 khách sạn. */
export function useHotelWallet(hotelId: string, params: HotelWalletParams = {}) {
  return useQuery({
    queryKey: hotelRevenueKeys.wallet(hotelId, params),
    queryFn: () => hotelRevenueService.getWallet(hotelId, params),
    enabled: !!hotelId,
    // Giữ dữ liệu trang cũ khi đổi page/type để bảng không nhấp nháy.
    placeholderData: keepPreviousData,
  });
}
