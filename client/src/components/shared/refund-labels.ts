import { Clock, CheckCircle2, Banknote, XCircle } from 'lucide-react';
import type { Refund, RefundStatus } from '@/types/refund.types';

/**
 * Nhãn + helper dùng chung cho CẢ hai màn hoàn tiền (khách sạn duyệt · Platform Manager chuyển khoản).
 * Hai portal hiển thị đúng cùng bộ trạng thái nên gom về một chỗ.
 */

export const REFUND_STATUS_CONFIG: Record<
  RefundStatus,
  { label: string; class: string; icon: React.ComponentType<{ className?: string }>; hint: string }
> = {
  pending: {
    label: 'Pending review',
    class: 'bg-amber-100 text-amber-700',
    icon: Clock,
    hint: 'Waiting for the hotel to approve or reject.',
  },
  approved: {
    label: 'Approved',
    class: 'bg-blue-100 text-blue-700',
    icon: CheckCircle2,
    hint: 'Approved — waiting for the Platform Manager to transfer the money.',
  },
  processed: {
    label: 'Transferred',
    class: 'bg-emerald-100 text-emerald-700',
    icon: Banknote,
    hint: 'Money has been transferred back to the guest.',
  },
  rejected: {
    label: 'Rejected',
    class: 'bg-red-100 text-red-700',
    icon: XCircle,
    hint: 'The hotel rejected this refund request.',
  },
};

export const REFUND_STATUS_OPTIONS: { value: RefundStatus; label: string }[] = [
  { value: 'pending', label: REFUND_STATUS_CONFIG.pending.label },
  { value: 'approved', label: REFUND_STATUS_CONFIG.approved.label },
  { value: 'processed', label: REFUND_STATUS_CONFIG.processed.label },
  { value: 'rejected', label: REFUND_STATUS_CONFIG.rejected.label },
];

/** Số ngày khách sạn có để phản hồi — PHẢI khớp `REVIEW_DEADLINE_DAYS` ở BE (refund.service.ts). */
export const REVIEW_DEADLINE_DAYS = 3;

/**
 * Yêu cầu này do HỆ THỐNG duyệt, không phải người bấm.
 *
 * Hai trường hợp cùng khớp: (1) job tự duyệt khi khách sạn để quá hạn phản hồi,
 * (2) refund "tiền mồ côi" (tiền vào sau khi booking hết hạn giữ chỗ) — BE tạo thẳng ở
 * trạng thái `approved`. BE không có cờ phân biệt hai loại này; cả hai đều không cần KS xử lý.
 */
export function isSystemReviewed(refund: Refund): boolean {
  return refund.reviewedAt !== null && refund.reviewedBy === null;
}

/** Hoàn một phần: khách chỉ được trả lại ít hơn số đã thanh toán (phạt huỷ theo chính sách). */
export function isPartialRefund(refund: Refund): boolean {
  return Number(refund.amount) < Number(refund.payment.amount);
}

export interface RefundDeadlineInfo {
  deadline: Date;
  hoursLeft: number;
  isOverdue: boolean;
  /** Nhãn ngắn hiển thị trên hàng đang chờ duyệt. */
  label: string;
  /** Sắp hết hạn (< 24h) hoặc đã quá hạn ⇒ tô cảnh báo. */
  urgent: boolean;
}

/**
 * Hạn chót khách sạn phải phản hồi = `createdAt` + 3 ngày. Quá hạn thì job của BE TỰ DUYỆT
 * (số tiền hoàn vốn tính theo chính sách của chính khách sạn — duyệt là để xét ngoại lệ,
 * không phải quyền phủ quyết). Đây là thông tin quan trọng nhất trên một hàng `pending`.
 */
export function reviewDeadlineInfo(createdAt: string, now: Date = new Date()): RefundDeadlineInfo {
  const deadline = new Date(
    new Date(createdAt).getTime() + REVIEW_DEADLINE_DAYS * 24 * 60 * 60 * 1000
  );
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isOverdue = hoursLeft <= 0;

  let label: string;
  if (isOverdue) {
    label = 'Overdue — auto-approving';
  } else if (hoursLeft < 1) {
    label = 'Less than 1h left';
  } else if (hoursLeft < 24) {
    label = `${Math.floor(hoursLeft)}h left`;
  } else {
    label = `${Math.floor(hoursLeft / 24)}d left`;
  }

  return { deadline, hoursLeft, isOverdue, label, urgent: hoursLeft < 24 };
}
