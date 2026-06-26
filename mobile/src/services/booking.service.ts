import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type { Booking } from '@/types/booking.types';
export const bookingService = {
  getMine: async (): Promise<Paginated<Booking>> =>
    (
      await api.get<Paginated<Booking>>('/bookings/me', {
        params: { sortBy: 'createdAt:desc' },
      })
    ).data,
};
