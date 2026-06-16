import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type {
  HotelSearchParams,
  HotelSearchResult,
  RoomType,
  RoomTypeParams,
} from '@/types/hotel.types';

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
