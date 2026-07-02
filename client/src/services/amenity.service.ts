import { api } from '@/lib/api';
import type { Amenity, CreateAmenityDto, UpdateAmenityDto } from '@/types/hotel.types';

/** Tầng gọi API danh mục tiện nghi (`/v1/amenities`). */
export const amenityService = {
  /** GET /amenities — list toàn bộ tiện nghi (public, lọc category tùy chọn). */
  async getAmenities(category?: Amenity['category']): Promise<Amenity[]> {
    const { data } = await api.get<Amenity[]>('/amenities', {
      params: category ? { category } : undefined,
    });
    return data;
  },

  /** POST /amenities — tạo tiện nghi mới vào catalog (partner/admin, quyền manageAmenities). */
  async createAmenity(dto: CreateAmenityDto): Promise<Amenity> {
    const { data } = await api.post<Amenity>('/amenities', dto);
    return data;
  },

  /** PATCH /amenities/:id — cập nhật tiện nghi (partner/admin). */
  async updateAmenity(amenityId: string, dto: UpdateAmenityDto): Promise<Amenity> {
    const { data } = await api.patch<Amenity>(`/amenities/${amenityId}`, dto);
    return data;
  },

  /** DELETE /amenities/:id — xoá tiện nghi (chỉ khi chưa được gán ở đâu). */
  async deleteAmenity(amenityId: string): Promise<void> {
    await api.delete(`/amenities/${amenityId}`);
  },
};
