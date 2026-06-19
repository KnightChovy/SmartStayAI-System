import { api } from '@/lib/api';
import type { Amenity } from '@/types/hotel.types';

/** Tầng gọi API danh mục tiện nghi (`/v1/amenities`). */
export const amenityService = {
  /** GET /amenities — list toàn bộ tiện nghi (public, lọc category tùy chọn). */
  async getAmenities(category?: Amenity['category']): Promise<Amenity[]> {
    const { data } = await api.get<Amenity[]>('/amenities', {
      params: category ? { category } : undefined,
    });
    return data;
  },
};
