import type { CommissionRequestStatus } from '@prisma/client';

/** [Đối tác] Nộp đơn xin giảm hoa hồng cho một khách sạn. */
export interface CreateCommissionRequestDto {
  /** Mức % đề xuất — phải thấp hơn mức đang áp và không dưới sàn cứng */
  requestedRate: number;
  /** Lý do xin giảm, để Platform Manager có căn cứ quyết định */
  reason: string;
}

/** [Platform Manager] Duyệt / từ chối một đơn. */
export interface ReviewCommissionRequestDto {
  decision: 'approve' | 'reject';
  /** Bắt buộc khi từ chối — để đối tác biết vì sao */
  rejectionReason?: string;
}

/** [Platform Manager] Đặt mức hoa hồng nền cho toàn sàn, áp từ một ngày trong tương lai. */
export interface SetBaseRateDto {
  rate: number;
  /** Ngày bắt đầu áp dụng (YYYY-MM-DD) — phải cách hôm nay đủ thời gian báo trước */
  effectiveFrom: string;
}

/** Bộ lọc khi liệt kê đơn. */
export interface CommissionRequestFilter {
  status?: CommissionRequestStatus;
  /** Chỉ dùng ở bản toàn sàn — bản của khách sạn đã cố định hotelId theo route */
  hotelId?: string;
}

/** Phân trang khi liệt kê đơn. */
export interface CommissionRequestQueryOptions {
  limit?: number;
  page?: number;
}
