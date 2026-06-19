import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * Lấy danh sách khách sạn của một partner (`GET /hotels/:userId`).
 * `userId` là `User.id` của chủ sở hữu (ownerId). Hook tự tắt khi chưa có id.
 */
export function usePartnerHotels(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.hotels.byPartner(userId ?? ''),
    queryFn: () => hotelService.getByPartner(userId!),
    enabled: !!userId,
  });
}
