import type { RoomStatus, HkStatus } from '@prisma/client';

/** Payload tạo phòng vật lý trong khách sạn. */
export interface CreateRoomDto {
  roomTypeId: string;
  roomNumber: string;
  floor?: number;
  /** Không nhận 'occupied' — trạng thái đó chỉ sinh ra từ check-in */
  status?: RoomStatus;
  notes?: string;
}

/** Payload cập nhật phòng (số phòng, tầng, ghi chú, ngừng dùng, trạng thái vận hành). */
export interface UpdateRoomDto {
  roomNumber?: string;
  floor?: number;
  status?: RoomStatus;
  notes?: string;
  /** false = ngừng dùng phòng (thay cho xoá, vì booking cũ còn tham chiếu tới nó) */
  isActive?: boolean;
}

/** Payload đổi trạng thái buồng phòng — chiều duy nhất staff bấm trực tiếp. */
export interface UpdateHousekeepingDto {
  hkStatus: HkStatus;
}

/** Bộ lọc khi liệt kê phòng của khách sạn. */
export interface RoomFilter {
  status?: RoomStatus;
  roomTypeId?: string;
  isActive?: boolean;
}

/** Khoảng ngày của lịch tồn kho — bao gồm CẢ hai đầu (from và to đều là ngày có dữ liệu). */
export interface InventoryCalendarRange {
  from: Date;
  to: Date;
}

/** Tuỳ chọn phân trang / sắp xếp khi liệt kê phòng. */
export interface RoomQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}
