import type { AmenityCategory } from '@prisma/client';

/** Payload tạo tiện nghi vào catalog dùng chung (partner hoặc admin). */
export interface CreateAmenityDto {
  name: string;
  icon?: string;
  category: AmenityCategory;
}

/** Bộ lọc khi liệt kê tiện nghi. */
export interface AmenityFilter {
  category?: AmenityCategory;
}

/**
 * Một dòng gán tiện nghi (cho khách sạn hoặc loại phòng) — dùng chung cho HotelAmenity & RoomTypeAmenity.
 * isFree mặc định true; quantity (vd số bàn ủi, số chỗ đỗ xe) tuỳ chọn.
 */
export interface AmenityAssignmentInput {
  amenityId: string;
  isFree?: boolean;
  quantity?: number | null;
}
