import { api } from '@/lib/api';
import { cleanParams } from '@/utils/cleanParams';
import type { Paginated } from '@/types/api.type';
import type {
  HotelSearchParams,
  HotelSearchResult,
  RoomType,
  RoomTypeParams,
} from '@/types/hotels.type';

/** Tầng gọi API khách sạn / loại phòng (`/v1/hotels`). */
export const hotelsService = {
  /** Tìm khách sạn theo bộ lọc (`GET /hotels`). Public. */
  async search(params: HotelSearchParams = {}): Promise<Paginated<HotelSearchResult>> {
    const { data } = await api.get<Paginated<HotelSearchResult>>('/hotels', {
      params: cleanParams(params),
    });
    return data;
  },

  /** Chi tiết một khách sạn cho guest (`GET /hotels/:hotelId`). Public. */
  async getById(hotelId: string): Promise<HotelSearchResult> {
    const { data } = await api.get<HotelSearchResult>(`/hotels/${hotelId}`);
    return data;
  },

  /** Loại phòng của một khách sạn (`GET /hotels/:hotelId/room-types`). Public. */
  async getRoomTypes(hotelId: string, params: RoomTypeParams = {}): Promise<RoomType[]> {
    const { data } = await api.get<RoomType[]>(`/hotels/${hotelId}/room-types`, {
      params: cleanParams(params),
    });
    return data;
  },
};
