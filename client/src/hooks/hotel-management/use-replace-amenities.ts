import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { ReplaceAmenitiesDto } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** PUT /:hotelId/room-types/:roomTypeId/amenities — gán lại toàn bộ tiện nghi. */
export function useReplaceAmenities(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomTypeId, dto }: { roomTypeId: string; dto: ReplaceAmenitiesDto }) =>
      hotelManagementService.replaceAmenities(hotelId, roomTypeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelManagementKeys.roomTypes(hotelId) });
    },
  });
}
