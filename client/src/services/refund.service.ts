import { api } from '@/lib/api';
import type {
  HotelRefundsParams,
  PlatformRefundsParams,
  ProcessRefundDto,
  Refund,
  RefundsResponse,
  ReviewRefundDto,
} from '@/types/refund.types';

/**
 * Bỏ param rỗng trước khi gửi. Bắt buộc: BE validate query bằng Joi KHÔNG cho key lạ,
 * và `?status=` rỗng sẽ trượt enum → 400.
 */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export const refundService = {
  /**
   * Hàng đợi duyệt hoàn tiền của MỘT khách sạn — `GET /hotels/:hotelId/refunds`.
   * Quyền: chủ KS / manager / staff được phân công (BE kiểm qua `getOperableHotel`).
   */
  async listHotelRefunds(
    hotelId: string,
    params: HotelRefundsParams = {}
  ): Promise<RefundsResponse> {
    const { data } = await api.get<RefundsResponse>(`/hotels/${hotelId}/refunds`, {
      params: cleanParams(params),
    });
    return data;
  },

  /**
   * Khách sạn duyệt / từ chối — `PATCH /hotels/:hotelId/refunds/:refundId/review`.
   * KHÔNG chuyển tiền: `approved` chỉ là "đồng ý hoàn", tiền rời đi ở `process`.
   */
  async review(hotelId: string, refundId: string, dto: ReviewRefundDto): Promise<Refund> {
    const { data } = await api.patch<Refund>(
      `/hotels/${hotelId}/refunds/${refundId}/review`,
      dto
    );
    return data;
  },

  /**
   * Hàng đợi hoàn tiền TOÀN SÀN — `GET /platform-manager/refunds` (quyền `manageCommissions`).
   * `status=approved` = hàng đợi cần chuyển khoản.
   */
  async listPlatformRefunds(params: PlatformRefundsParams = {}): Promise<RefundsResponse> {
    const { data } = await api.get<RefundsResponse>('/platform-manager/refunds', {
      params: cleanParams(params),
    });
    return data;
  },

  /**
   * Platform Manager đánh dấu ĐÃ CHUYỂN KHOẢN —
   * `PATCH /platform-manager/refunds/:refundId/process` (quyền `manageCommissions`).
   * Gọi SAU KHI tiền đã thực sự chuyển đi. Đây là nơi duy nhất tiền rời khỏi khách sạn:
   * BE tính lại hoa hồng + trừ ví trong cùng transaction. KHÔNG hoàn tác được.
   */
  async process(refundId: string, dto: ProcessRefundDto): Promise<Refund> {
    const { data } = await api.patch<Refund>(
      `/platform-manager/refunds/${refundId}/process`,
      dto
    );
    return data;
  },
};
