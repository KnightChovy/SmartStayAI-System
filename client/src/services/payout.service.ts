import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type {
  HotelPayout,
  PayoutListParams,
  PlatformPayout,
  PlatformPayoutDetail,
  RequestPayoutDto,
  ReviewPayoutDto,
} from '@/types/payout.types';

/** Bỏ field rỗng cho query string gọn. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

export const payoutService = {
  // ─── Phía khách sạn ────────────────────────────────────────────────────────

  /**
   * `POST /hotels/:id/payouts` — CHỈ **chủ khách sạn** gọi được (service kiểm `partner.ownerId`),
   * không phải staff/manager/admin. Backend còn đòi khách sạn đã có tài khoản nhận tiền.
   */
  async request(hotelId: string, payload: RequestPayoutDto): Promise<HotelPayout> {
    const { data } = await api.post<HotelPayout>(
      `/hotels/${hotelId}/payouts`,
      payload
    );
    return data;
  },

  /** `GET /hotels/:id/payouts` — lịch sử rút của KS mình (chủ KS / manager). */
  async listForHotel(
    hotelId: string,
    params: PayoutListParams = {}
  ): Promise<Paginated<HotelPayout>> {
    const { data } = await api.get<Paginated<HotelPayout>>(
      `/hotels/${hotelId}/payouts`,
      { params: cleanParams(params) }
    );
    return data;
  },

  // ─── Phía Platform Manager ─────────────────────────────────────────────────

  /** `GET /platform-manager/payouts` — hàng chờ toàn sàn. */
  async listForPlatform(
    params: PayoutListParams = {}
  ): Promise<Paginated<PlatformPayout>> {
    const { data } = await api.get<Paginated<PlatformPayout>>(
      '/platform-manager/payouts',
      { params: cleanParams(params) }
    );
    return data;
  },

  /** `GET /platform-manager/payouts/:id` — kèm số tài khoản ĐÃ GIẢI MÃ. Chỉ gọi khi sắp chuyển tiền. */
  async getForPlatform(payoutId: string): Promise<PlatformPayoutDetail> {
    const { data } = await api.get<PlatformPayoutDetail>(
      `/platform-manager/payouts/${payoutId}`
    );
    return data;
  },

  /** `PATCH /platform-manager/payouts/:id/review` — duyệt (đã chuyển khoản) hoặc từ chối. */
  async review(
    payoutId: string,
    payload: ReviewPayoutDto
  ): Promise<PlatformPayoutDetail> {
    const { data } = await api.patch<PlatformPayoutDetail>(
      `/platform-manager/payouts/${payoutId}/review`,
      payload
    );
    return data;
  },
};
