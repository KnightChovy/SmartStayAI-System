import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type { Hotel, HotelSearchParams } from '@/types/hotel.types';
export const hotelService = {
  search: async (params: HotelSearchParams = {}): Promise<Paginated<Hotel>> =>
    (await api.get<Paginated<Hotel>>('/hotels', { params })).data,
};
