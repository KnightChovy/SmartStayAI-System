import type { BookingStatus, PaymentMethod } from '@/types/staff.types';

export type RefundStatus = 'pending' | 'approved' | 'processed' | 'rejected';

export type RefundDecision = 'approve' | 'reject';

/** Khách đã yêu cầu hoàn tiền. */
export interface RefundRequester {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface RefundReviewer {
  id: string;
  fullName: string;
}

export interface RefundBooking {
  id: string;
  bookingCode: string;
  checkInDate: string;
  checkOutDate: string;
  /** Decimal → string */
  totalAmount: string;
  status: BookingStatus;
  cancelledAt: string | null;
  cancellationReason: string | null;
  hotel: { id: string; name: string; city: string };
  roomType: { id: string; name: string };
}

export interface RefundPayment {
  id: string;
  paymentMethod: PaymentMethod;

  amount: string;
  paidAt: string | null;
  booking: RefundBooking;
}

export interface Refund {
  id: string;
  paymentId: string;
  requestedBy: string;

  amount: string;
  reason: string;
  status: RefundStatus;

  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;

  refundTransactionId: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requesterUser: RefundRequester;
  reviewer: RefundReviewer | null;
  payment: RefundPayment;
}

export interface RefundsResponse {
  results: Refund[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

/** Query cho `GET /hotels/:hotelId/refunds`. */
export interface HotelRefundsParams {
  status?: RefundStatus;
  limit?: number;
  page?: number;
}

/** Query cho `GET /platform-manager/refunds` — lọc thêm theo khách sạn. */
export interface PlatformRefundsParams extends HotelRefundsParams {
  hotelId?: string;
}

export type ReviewRefundDto =
  | { decision: 'approve' }
  | { decision: 'reject'; rejectionReason: string };

/** Body của `PATCH /platform-manager/refunds/:refundId/process`. */
export interface ProcessRefundDto {
  /** Mã giao dịch chuyển khoản THẬT (từ ngân hàng/cổng) để đối soát. */
  refundTransactionId: string;
}
