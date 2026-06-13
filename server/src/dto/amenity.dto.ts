import type { AmenityCategory } from '@prisma/client';

/** Payload tạo tiện nghi (admin). */
export interface CreateAmenityDto {
  name: string;
  icon?: string;
  category: AmenityCategory;
}

/** Bộ lọc khi liệt kê tiện nghi. */
export interface AmenityFilter {
  category?: AmenityCategory;
}
