import { api } from '@/lib/api';
import { cleanParams } from '@/utils/cleanParams';
import type { Amenity, AmenityParams } from '@/types/amenities.type';

/** Tầng gọi API danh mục tiện nghi (`/v1/amenities`). */
export const amenitiesService = {
  /** Danh sách tiện nghi (`GET /amenities`). Public, lọc theo category tuỳ chọn. */
  async getAll(params: AmenityParams = {}): Promise<Amenity[]> {
    const { data } = await api.get<Amenity[]>('/amenities', {
      params: cleanParams(params),
    });
    return data;
  },
};
