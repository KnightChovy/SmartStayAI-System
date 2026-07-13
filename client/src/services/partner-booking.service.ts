import { api } from '@/lib/api';
import type {
  PartnerBookingsParams,
  PartnerBookingsResponse,
} from '@/types/partner-bookings.types';

/** Bỏ các field undefined/null/rỗng để query string gọn gàng. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export const partnerBookingService = {
  /** Bookings gộp toàn bộ khách sạn của partner — `GET /hotel-partners/me/bookings`. */
  async listMine(
    params: PartnerBookingsParams = {}
  ): Promise<PartnerBookingsResponse> {
    const { data } = await api.get<PartnerBookingsResponse>('/hotel-partners/me/bookings', {
      params: cleanParams(params),
    });
    return data;
  },
};
