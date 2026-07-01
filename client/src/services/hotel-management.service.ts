import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type {
  ManagedRoomType,
  ManagedRoomTypeImage,
  PhysicalRoom,
  PricingRule,
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
  AddRoomTypeImagesDto,
  ReplaceAmenitiesDto,
  CreateRoomDto,
  UpdateRoomDto,
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
  RoomListParams,
  PricingRuleListParams,
} from '@/types/hotel-management.types';

/** Bỏ các field undefined/null/'' để query string gọn gàng. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * Tầng gọi API quản trị khách sạn (`/v1/hotels/:hotelId/...`).
 * Tất cả endpoint cần token chủ khách sạn hoặc quyền `manageHotels`.
 */
export const hotelManagementService = {
  // ─── Room types ─────────────────────────────────────────────────────────────

  /** #1 GET /:hotelId/room-types/manage — list loại phòng (gồm đã tắt). */
  async getRoomTypes(hotelId: string): Promise<ManagedRoomType[]> {
    const { data } = await api.get<ManagedRoomType[]>(`/hotels/${hotelId}/room-types/manage`);
    return data;
  },

  /** #2 POST /:hotelId/room-types — tạo loại phòng. */
  async createRoomType(hotelId: string, dto: CreateRoomTypeDto): Promise<ManagedRoomType> {
    const { data } = await api.post<ManagedRoomType>(`/hotels/${hotelId}/room-types`, dto);
    return data;
  },

  /** #3 PUT /:hotelId/room-types/:roomTypeId — cập nhật loại phòng. */
  async updateRoomType(
    hotelId: string,
    roomTypeId: string,
    dto: UpdateRoomTypeDto
  ): Promise<ManagedRoomType> {
    const { data } = await api.put<ManagedRoomType>(
      `/hotels/${hotelId}/room-types/${roomTypeId}`,
      dto
    );
    return data;
  },

  /** #3b DELETE /:hotelId/room-types/:roomTypeId — xoá loại phòng (chỉ khi chưa có phòng/booking). */
  async deleteRoomType(hotelId: string, roomTypeId: string): Promise<void> {
    await api.delete(`/hotels/${hotelId}/room-types/${roomTypeId}`);
  },

  /** #4 POST /:hotelId/room-types/:roomTypeId/images — thêm ảnh (trả về toàn bộ ảnh). */
  async addRoomTypeImages(
    hotelId: string,
    roomTypeId: string,
    dto: AddRoomTypeImagesDto
  ): Promise<ManagedRoomTypeImage[]> {
    const { data } = await api.post<ManagedRoomTypeImage[]>(
      `/hotels/${hotelId}/room-types/${roomTypeId}/images`,
      dto
    );
    return data;
  },

  /** #5 PUT /:hotelId/room-types/:roomTypeId/amenities — gán lại toàn bộ tiện nghi. */
  async replaceAmenities(
    hotelId: string,
    roomTypeId: string,
    dto: ReplaceAmenitiesDto
  ): Promise<ManagedRoomType> {
    const { data } = await api.put<ManagedRoomType>(
      `/hotels/${hotelId}/room-types/${roomTypeId}/amenities`,
      dto
    );
    return data;
  },

  // ─── Physical rooms ───────────────────────────────────────────────────────────

  /** #6 POST /:hotelId/rooms — tạo phòng vật lý. */
  async createRoom(hotelId: string, dto: CreateRoomDto): Promise<PhysicalRoom> {
    const { data } = await api.post<PhysicalRoom>(`/hotels/${hotelId}/rooms`, dto);
    return data;
  },

  /** #7 GET /:hotelId/rooms — list phòng (phân trang, lọc status/loại phòng). */
  async getRooms(hotelId: string, params: RoomListParams = {}): Promise<Paginated<PhysicalRoom>> {
    const { data } = await api.get<Paginated<PhysicalRoom>>(`/hotels/${hotelId}/rooms`, {
      params: cleanParams(params),
    });
    return data;
  },

  /** #8 PUT /:hotelId/rooms/:roomId — cập nhật phòng. */
  async updateRoom(hotelId: string, roomId: string, dto: UpdateRoomDto): Promise<PhysicalRoom> {
    const { data } = await api.put<PhysicalRoom>(`/hotels/${hotelId}/rooms/${roomId}`, dto);
    return data;
  },

  /** #8b DELETE /:hotelId/rooms/:roomId — xoá phòng vật lý (chỉ khi phòng chưa từng được đặt). */
  async deleteRoom(hotelId: string, roomId: string): Promise<void> {
    await api.delete(`/hotels/${hotelId}/rooms/${roomId}`);
  },

  // ─── Pricing rules ────────────────────────────────────────────────────────────

  /** #9 POST /:hotelId/pricing-rules — tạo rule. */
  async createPricingRule(hotelId: string, dto: CreatePricingRuleDto): Promise<PricingRule> {
    const { data } = await api.post<PricingRule>(`/hotels/${hotelId}/pricing-rules`, dto);
    return data;
  },

  /** #10 GET /:hotelId/pricing-rules — list rule (sort priority desc, createdAt desc). */
  async getPricingRules(
    hotelId: string,
    params: PricingRuleListParams = {}
  ): Promise<PricingRule[]> {
    const { data } = await api.get<PricingRule[]>(`/hotels/${hotelId}/pricing-rules`, {
      params: cleanParams(params),
    });
    return data;
  },

  /** #11 PUT /:hotelId/pricing-rules/:ruleId — cập nhật rule. */
  async updatePricingRule(
    hotelId: string,
    ruleId: string,
    dto: UpdatePricingRuleDto
  ): Promise<PricingRule> {
    const { data } = await api.put<PricingRule>(
      `/hotels/${hotelId}/pricing-rules/${ruleId}`,
      dto
    );
    return data;
  },

  /** #12 DELETE /:hotelId/pricing-rules/:ruleId — xoá rule (204 No Content). */
  async deletePricingRule(hotelId: string, ruleId: string): Promise<void> {
    await api.delete(`/hotels/${hotelId}/pricing-rules/${ruleId}`);
  },
};
