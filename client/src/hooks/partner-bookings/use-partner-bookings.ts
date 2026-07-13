import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { partnerBookingKeys } from '@/hooks/partner-bookings/keys';
import { partnerBookingService } from '@/services/partner-booking.service';
import type { PartnerBookingsParams } from '@/types/partner-bookings.types';

/** `GET /hotel-partners/me/bookings` — bookings gộp toàn bộ khách sạn của partner. */
export function usePartnerBookings(params: PartnerBookingsParams = {}) {
  return useQuery({
    queryKey: partnerBookingKeys.mine(params),
    queryFn: () => partnerBookingService.listMine(params),
    // Giữ dữ liệu trang cũ khi đổi filter/page để bảng không nhấp nháy.
    placeholderData: keepPreviousData,
  });
}
