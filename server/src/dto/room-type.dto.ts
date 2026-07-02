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
  // ----- Chi tiết bổ sung kiểu booking.com (Pha 1 DB) -----
  maxAdults?: number;
  maxChildren?: number;
  sizeUnit?: 'sqm' | 'sqft';
  isNonSmoking?: boolean;
  hasPrivateBathroom?: boolean;
  hasBalcony?: boolean;
}

/** Payload cập nhật loại phòng — mọi field đều tuỳ chọn. */
export type UpdateRoomTypeDto = Partial<CreateRoomTypeDto>;

/** Một ảnh thêm vào loại phòng (URL đã upload qua POST /v1/uploads trước). */
export interface RoomTypeImageInput {
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

/** Một dòng cấu hình giường của loại phòng (thay thế toàn bộ khi PUT). */
export interface RoomBedInput {
  bedType: 'single' | 'double' | 'queen' | 'king' | 'sofa_bed' | 'bunk';
  quantity?: number;
}
