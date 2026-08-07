import { useQuery } from '@tanstack/react-query';
import { hotelRevenueKeys } from '@/hooks/hotel-revenue/keys';
import { hotelRevenueService } from '@/services/hotel-revenue.service';

/**
 * `GET /hotels/:id/wallet` — 3 số dư của ví khách sạn.
 *
 * ⚠️ Không còn tham số: sổ giao dịch đã chuyển sang `useHotelRevenue` (field `transactions`).
 */
export function useHotelWallet(hotelId: string) {
  return useQuery({
    queryKey: hotelRevenueKeys.wallet(hotelId),
    queryFn: () => hotelRevenueService.getWallet(hotelId),
    enabled: !!hotelId,
  });
}
