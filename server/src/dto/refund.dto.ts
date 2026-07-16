import type { RefundStatus } from '@prisma/client';

/** Bộ lọc khi liệt kê yêu cầu hoàn tiền. */
export interface RefundFilter {
  status?: RefundStatus;
  /** Chỉ dùng ở bản admin toàn sàn — bản của khách sạn đã cố định hotelId theo route */
  hotelId?: string;
}

/** Phân trang khi liệt kê yêu cầu hoàn tiền. */
export interface RefundQueryOptions {
  limit?: number;
  page?: number;
}

/** Khách sạn duyệt / từ chối một yêu cầu hoàn tiền. */
export interface ReviewRefundDto {
  decision: 'approve' | 'reject';
  /** Bắt buộc khi từ chối — để khách biết vì sao */
  rejectionReason?: string;
}

/** Admin đánh dấu đã chuyển khoản hoàn tiền xong. */
export interface ProcessRefundDto {
  /** Mã giao dịch chuyển khoản THẬT (từ ngân hàng/cổng), không phải mã giả lập */
  refundTransactionId: string;
}
