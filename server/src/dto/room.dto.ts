import type { RoomStatus } from '@prisma/client';

/** Payload tạo phòng vật lý trong khách sạn. */
export interface CreateRoomDto {
  roomTypeId: string;
  roomNumber: string;
  floor?: number;
  status?: RoomStatus;
  notes?: string;
}

/** Payload cập nhật phòng (đổi trạng thái dọn phòng/bảo trì, số phòng, tầng, ghi chú). */
export interface UpdateRoomDto {
  roomNumber?: string;
  floor?: number;
  status?: RoomStatus;
  notes?: string;
}

/** Bộ lọc khi liệt kê phòng của khách sạn. */
export interface RoomFilter {
  status?: RoomStatus;
  roomTypeId?: string;
}

/** Tuỳ chọn phân trang / sắp xếp khi liệt kê phòng. */
export interface RoomQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}
