import { useQuery } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import { hotelManagementKeys } from './keys';

/** GET /:hotelId/room-types/manage — list loại phòng (gồm đã tắt). */
export function useRoomTypes(hotelId: string | null | undefined) {
  return useQuery({
    queryKey: hotelManagementKeys.roomTypes(hotelId ?? ''),
    queryFn: () => hotelManagementService.getRoomTypes(hotelId!),
    enabled: !!hotelId,
  });
}
