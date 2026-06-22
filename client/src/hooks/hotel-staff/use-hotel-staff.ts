import { useQuery } from '@tanstack/react-query';
import { hotelStaffService } from '@/services/hotel-staff.service';
import { hotelStaffKeys } from './keys';

/** GET /hotels/:hotelId/staff — danh sách nhân viên còn hiệu lực của khách sạn. */
export function useHotelStaff(hotelId: string | null | undefined) {
  return useQuery({
    queryKey: hotelStaffKeys.list(hotelId ?? ''),
    queryFn: () => hotelStaffService.list(hotelId!),
    enabled: !!hotelId,
  });
}
