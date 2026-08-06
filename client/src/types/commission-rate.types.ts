import type { Paginated } from '@/types/api.types';

/**
 * Hoa hồng có HAI TẦNG:
 * - `platform_base`: mức nền toàn sàn do Platform Manager đặt, vô thời hạn tới khi có mức nền mới.
 * - `hotel_agreement`: ưu đãi riêng cho MỘT khách sạn, đúng 12 tháng, thắng mức nền khi còn hiệu lực.
 *
 * Ưu đãi gắn với KHÁCH SẠN chứ không phải đối tác — một đối tác nhiều khách sạn có thể chịu
 * các mức khác nhau. Hết hạn thì tự rơi về mức nền, không ai phải bấm gì.
 */
export type CommissionRateSource = 'platform_base' | 'hotel_agreement';

export type CommissionRequestStatus = 'pending' | 'approved' | 'rejected';

/** Mọi tỷ lệ là Decimal của Prisma → backend serialize thành string (vd `"12.00"`). */
export interface CommissionRate {
  id: string;
  /** `null` = mức nền toàn sàn. */
  hotelId: string | null;
  rate: string;
  /** `YYYY-MM-DD` */
  effectiveFrom: string;
  /** `null` = vô hạn (chỉ mức nền mới có). */
  effectiveTo: string | null;
  source: CommissionRateSource;
  requestId: string | null;
  createdBy: string;
  lastReminderDaysBefore: number | null;
  createdAt: string;
}

export interface CommissionRequestUser {
  id: string;
  fullName: string | null;
  email: string;
}

export interface CommissionRequestHotel {
  id: string;
  name: string;
  city: string;
}

export interface CommissionRateRequest {
  id: string;
  hotelId: string;
  hotel: CommissionRequestHotel;
  requestedBy: string;
  requestedByUser: CommissionRequestUser;
  requestedRate: string;
  /**
   * Mức SẼ chịu nếu đơn không được duyệt — KHÔNG phải mức đang hưởng.
   * Với đơn gia hạn đây là mức nền áp sau khi ưu đãi hiện tại hết hạn (có thể CAO HƠN mức đang hưởng).
   */
  currentRate: string;
  reason: string;
  status: CommissionRequestStatus;
  isRenewal: boolean;
  reviewedBy: string | null;
  reviewedByUser: CommissionRequestUser | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  /** Ưu đãi 12 tháng được sinh ra khi duyệt. */
  agreement: CommissionRate | null;
  createdAt: string;
  updatedAt: string;
}

/** Ưu đãi riêng đang áp cho khách sạn (nếu có). */
export interface HotelCommissionAgreement {
  id: string;
  rate: string;
  effectiveFrom: string;
  effectiveTo: string;
  daysRemaining: number;
  /**
   * Mức nền của NGÀY SAU KHI ưu đãi hết hạn — KHÁC `baseRate` khi Platform Manager
   * đã lên lịch đổi mức nền. Nói "sau khi hết hạn sẽ về X%" thì phải dùng số này.
   */
  rateAfterExpiry: string;
}

/**
 * Có được nộp đơn không. `reason` là chuỗi tiếng Việt sẵn sàng hiển thị —
 * KHÔNG tự suy luận bốn điều kiện (đơn pending / cooldown 7 ngày / cửa sổ gia hạn / biên mức)
 * ở phía client, luật có thể đổi ở backend.
 */
export interface CommissionRequestPermission {
  allowed: boolean;
  reason: string | null;
  isRenewal: boolean;
}

/** `GET /hotels/:hotelId/commission-rate` — mọi thứ cần để render màn hình của đối tác. */
export interface HotelCommissionSummary {
  currentRate: string;
  source: CommissionRateSource;
  /** Mức nền HIỆN HÀNH (hôm nay). */
  baseRate: string;
  agreement: HotelCommissionAgreement | null;
  pendingRequest: CommissionRateRequest | null;
  canRequest: CommissionRequestPermission;
}

export interface CreateCommissionRequestDto {
  requestedRate: number;
  reason: string;
}

export interface HotelCommissionRequestsParams {
  status?: CommissionRequestStatus;
  limit?: number;
  page?: number;
}

/** Query của Platform Manager — lọc thêm theo khách sạn. */
export interface PlatformCommissionRequestsParams extends HotelCommissionRequestsParams {
  hotelId?: string;
}

export type CommissionRequestsResponse = Paginated<CommissionRateRequest>;

/**
 * `rejectionReason` BẮT BUỘC khi reject và BỊ CẤM khi approve (Joi khai `forbidden` —
 * gửi kèm lúc approve sẽ 400). Vì vậy union chứ không phải object có field optional.
 */
export type ReviewCommissionRequestDto =
  | { decision: 'approve' }
  | { decision: 'reject'; rejectionReason: string };

/** `GET /platform-manager/commission-rate` — mức nền hiện tại + lịch đã đặt + lịch sử. */
export interface PlatformBaseRate {
  currentRate: string;
  /** Mức nền đã lên lịch nhưng chưa tới ngày hiệu lực. */
  scheduled: CommissionRate | null;
  /** Mới nhất trước. */
  history: CommissionRate[];
  minRate: number;
  maxRate: number;
}

export interface SetBaseRateDto {
  rate: number;
  /** `YYYY-MM-DD`, phải cách hôm nay ít nhất 30 ngày. */
  effectiveFrom: string;
}
