import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type {
  AddHotelImagesDto,
  Hotel,
  HotelImage,
  HotelSearchParams,
  HotelSearchResult,
  PartnerHotel,
  RoomType,
  RoomTypeParams,
  UpdateHotelDto,
} from '@/types/hotel.types';
import type {
  HotelAmenity,
  ManagedHotel,
  SetHotelAmenitiesDto,
} from '@/types/hotel-management.types';

/** Bỏ các field undefined/rỗng để query string gọn gàng. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export const hotelService = {
  /** Tìm khách sạn (`GET /hotels`). Public. */
  async search(params: HotelSearchParams): Promise<Paginated<HotelSearchResult>> {
    const { data } = await api.get<Paginated<HotelSearchResult>>('/hotels', {
      params: cleanParams(params),
    });
    return data;
  },

  /**
   * Danh sách khách sạn của partner đang đăng nhập (`GET /hotels/mine`).
   * Backend lấy partner từ access token nên không cần truyền id.
   */
  async getMine(): Promise<PartnerHotel[]> {
    const { data } = await api.get<PartnerHotel[]>('/hotels/mine');
    return data;
  },

  /**
   * Chi tiết khách sạn cho chủ/manager (`GET /hotels/:id/manage`).
   * Xem được cả khi chưa listed; kèm ảnh, amenity và loại phòng.
   */
  async getManaged(hotelId: string): Promise<ManagedHotel> {
    const { data } = await api.get<ManagedHotel>(`/hotels/${hotelId}/manage`);
    return data;
  },

  /**
   * Bật/tắt mở bán khách sạn của partner (`PATCH /hotels/:id/publish`).
   * Trả về Hotel (raw) sau cập nhật. Bật bán yêu cầu KS đã duyệt (`isActive`)
   * và có ít nhất một loại phòng đang bật — BE trả 400 nếu chưa đạt; tắt bán luôn được.
   */
  async setListing(hotelId: string, isListed: boolean): Promise<Hotel> {
    const { data } = await api.patch<Hotel>(`/hotels/${hotelId}/publish`, { isListed });
    return data;
  },

  /** Cập nhật hồ sơ khách sạn của partner (`PATCH /hotels/:id`). */
  async update(hotelId: string, dto: UpdateHotelDto): Promise<Hotel> {
    const { data } = await api.patch<Hotel>(`/hotels/${hotelId}`, dto);
    return data;
  },

  /** Thêm ảnh khách sạn (`POST /hotels/:id/images`) — trả về toàn bộ ảnh sau khi thêm. */
  async addImages(hotelId: string, dto: AddHotelImagesDto): Promise<HotelImage[]> {
    const { data } = await api.post<HotelImage[]>(`/hotels/${hotelId}/images`, dto);
    return data;
  },

  /** Xoá một ảnh khách sạn (`DELETE /hotels/:id/images/:imageId`). */
  async deleteImage(hotelId: string, imageId: string): Promise<void> {
    await api.delete(`/hotels/${hotelId}/images/${imageId}`);
  },

  /** Đặt một ảnh làm ảnh chính (`PATCH /hotels/:id/images/:imageId/primary`). */
  async setPrimaryImage(hotelId: string, imageId: string): Promise<HotelImage> {
    const { data } = await api.patch<HotelImage>(`/hotels/${hotelId}/images/${imageId}/primary`);
    return data;
  },

  /** Tiện nghi đã gán cho khách sạn (`GET /hotels/:id/amenities`). */
  async getAmenities(hotelId: string): Promise<HotelAmenity[]> {
    const { data } = await api.get<HotelAmenity[]>(`/hotels/${hotelId}/amenities`);
    return data;
  },

  /** Gán lại toàn bộ tiện nghi khách sạn (`PUT /hotels/:id/amenities`). */
  async setAmenities(hotelId: string, dto: SetHotelAmenitiesDto): Promise<HotelAmenity[]> {
    const { data } = await api.put<HotelAmenity[]>(`/hotels/${hotelId}/amenities`, dto);
    return data;
  },

  /** Lấy loại phòng của một khách sạn (`GET /hotels/:id/room-types`). Public. */
  async getRoomTypes(hotelId: string, params: RoomTypeParams = {}): Promise<RoomType[]> {
    const { data } = await api.get<RoomType[]>(`/hotels/${hotelId}/room-types`, {
      params: cleanParams(params),
    });
    return data;
  },

  /**
   * Lấy thông tin khách sạn theo id.
   * Backend hiện CHƯA có endpoint `GET /hotels/:id`, nên tạm tìm trong kết quả
   * search (page lớn) rồi lọc theo id. Dùng cho trường hợp mở link chi tiết
   * trực tiếp mà không có dữ liệu truyền qua router state.
   */
  async getById(hotelId: string): Promise<HotelSearchResult | null> {
    const { data } = await api.get<Paginated<HotelSearchResult>>('/hotels', {
      params: { limit: 100 },
    });
    return data.results.find(h => h.id === hotelId) ?? null;
  },
};
