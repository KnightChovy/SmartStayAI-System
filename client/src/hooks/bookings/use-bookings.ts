import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';
import type { CreateBookingPayload, MyBookingsParams } from '@/types/booking.types';

/** Danh sách booking của tôi. */
export function useMyBookings(params: MyBookingsParams = {}) {
  return useQuery({
    queryKey: queryKeys.bookings.mine(params),
    queryFn: () => bookingService.getMine(params),
  });
}

/** Chi tiết một booking. */
export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => bookingService.getById(bookingId),
    enabled: !!bookingId,
  });
}

/** Tạo booking mới. */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

/** Hủy booking. */
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      bookingService.cancel(bookingId, reason),
    onSuccess: booking => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
      qc.setQueryData(queryKeys.bookings.detail(booking.id), booking);
    },
  });
}
