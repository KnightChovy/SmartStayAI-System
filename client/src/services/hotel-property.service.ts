import { api } from '@/lib/api';
import type {
  HotelCharge,
  HotelContact,
  HotelNearbyPlace,
  HotelPolicy,
  RoomBed,
  SetHotelChargesDto,
  SetHotelContactsDto,
  SetHotelNearbyPlacesDto,
  SetHotelPoliciesDto,
  SetRoomBedsDto,
} from '@/types/hotel-property.types';

/**
 * Các bộ thông tin "replace-all" của khách sạn: contacts / policies / charges /
 * nearby-places (hotel-level) và bed config (room-type-level). Mỗi PUT thay thế toàn bộ tập.
 */
export const hotelPropertyService = {
  // ── Contacts ──
  async getContacts(hotelId: string): Promise<HotelContact[]> {
    const { data } = await api.get<HotelContact[]>(`/hotels/${hotelId}/contacts`);
    return data;
  },
  async setContacts(hotelId: string, dto: SetHotelContactsDto): Promise<HotelContact[]> {
    const { data } = await api.put<HotelContact[]>(`/hotels/${hotelId}/contacts`, dto);
    return data;
  },

  // ── Policies (điều khoản văn bản) ──
  async getPolicies(hotelId: string): Promise<HotelPolicy[]> {
    const { data } = await api.get<HotelPolicy[]>(`/hotels/${hotelId}/policies`);
    return data;
  },
  async setPolicies(hotelId: string, dto: SetHotelPoliciesDto): Promise<HotelPolicy[]> {
    const { data } = await api.put<HotelPolicy[]>(`/hotels/${hotelId}/policies`, dto);
    return data;
  },

  // ── Charges (thuế/phí — ĐỔI SỐ Ở ĐÂY LÀ ĐỔI TIỀN KHÁCH TRẢ cho đơn mới) ──
  async getCharges(hotelId: string): Promise<HotelCharge[]> {
    const { data } = await api.get<HotelCharge[]>(`/hotels/${hotelId}/charges`);
    return data;
  },
  async setCharges(hotelId: string, dto: SetHotelChargesDto): Promise<HotelCharge[]> {
    const { data } = await api.put<HotelCharge[]>(`/hotels/${hotelId}/charges`, dto);
    return data;
  },

  // ── Nearby places ──
  async getNearbyPlaces(hotelId: string): Promise<HotelNearbyPlace[]> {
    const { data } = await api.get<HotelNearbyPlace[]>(`/hotels/${hotelId}/nearby-places`);
    return data;
  },
  async setNearbyPlaces(
    hotelId: string,
    dto: SetHotelNearbyPlacesDto
  ): Promise<HotelNearbyPlace[]> {
    const { data } = await api.put<HotelNearbyPlace[]>(`/hotels/${hotelId}/nearby-places`, dto);
    return data;
  },

  // ── Bed config (theo room type) ──
  async getBeds(hotelId: string, roomTypeId: string): Promise<RoomBed[]> {
    const { data } = await api.get<RoomBed[]>(
      `/hotels/${hotelId}/room-types/${roomTypeId}/beds`
    );
    return data;
  },
  async setBeds(
    hotelId: string,
    roomTypeId: string,
    dto: SetRoomBedsDto
  ): Promise<RoomBed[]> {
    const { data } = await api.put<RoomBed[]>(
      `/hotels/${hotelId}/room-types/${roomTypeId}/beds`,
      dto
    );
    return data;
  },
};
