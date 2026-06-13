/** Payload tạo loại phòng (partner quản lý). */
export interface CreateRoomTypeDto {
  name: string;
  description?: string;
  maxOccupancy: number;
  basePrice: number;
  areaSqm?: number;
  bedType?: string;
  viewType?: string;
  isActive?: boolean;
}

/** Payload cập nhật loại phòng — mọi field đều tuỳ chọn. */
export type UpdateRoomTypeDto = Partial<CreateRoomTypeDto>;

/** Một ảnh thêm vào loại phòng (URL đã upload qua POST /v1/uploads trước). */
export interface RoomTypeImageInput {
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
}
