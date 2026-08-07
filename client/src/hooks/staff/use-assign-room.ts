import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/**
 * Chốt trước phòng vật lý cho một đơn đã xác nhận
 * (`POST /hotels/:id/bookings/:bookingId/assign-room`).
 *
 * Đây là thứ biến ô **Held** trên bản đồ phòng từ phỏng đoán của FE thành dữ liệu thật: gán xong
 * thì `booking.bookingRooms` có bản ghi, và check-in sẽ dùng đúng phòng đó thay vì chọn lại.
 * Gọi lại với `roomId` khác = đổi phòng, không cần gỡ trước.
 */
export function useAssignRoom(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, roomId }: { bookingId: string; roomId: string }) =>
      staffService.assignRoom(hotelId as string, bookingId, { roomId }),
    // Đụng tới cả chi tiết đơn lẫn bản đồ phòng ⇒ làm mới cả nhánh staff.
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}
