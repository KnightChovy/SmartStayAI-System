import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { BASE_RATE_NOTICE_DAYS } from '@/validations/commission-rate.validation';
import type {
  CommissionRateSource,
  CommissionRequestStatus,
} from '@/types/commission-rate.types';

/**
 * Nhãn dùng chung cho CẢ hai màn hoa hồng (đối tác nộp đơn · Platform Manager duyệt).
 * Hai portal hiển thị đúng cùng bộ trạng thái nên gom về một chỗ để không trôi lệch.
 */

export const COMMISSION_STATUS_CONFIG: Record<
  CommissionRequestStatus,
  {
    label: string;
    class: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: 'Pending review',
    class: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    class: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    class: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
};

export const COMMISSION_STATUS_OPTIONS: {
  value: CommissionRequestStatus;
  label: string;
}[] = [
  { value: 'pending', label: COMMISSION_STATUS_CONFIG.pending.label },
  { value: 'approved', label: COMMISSION_STATUS_CONFIG.approved.label },
  { value: 'rejected', label: COMMISSION_STATUS_CONFIG.rejected.label },
];

export const COMMISSION_SOURCE_CONFIG: Record<
  CommissionRateSource,
  { label: string; class: string; hint: string }
> = {
  platform_base: {
    label: 'Platform base',
    class: 'bg-slate-100 text-slate-600',
    hint: 'This hotel is on the platform-wide base commission rate.',
  },
  hotel_agreement: {
    label: 'Special rate',
    class: 'bg-emerald-100 text-emerald-700',
    hint: 'This hotel is on its own negotiated rate, valid for 12 months.',
  },
};

/** `"12.00"` → `"12%"`, bỏ phần thập phân thừa cho gọn mắt. */
export function formatRate(rate: string | number | null | undefined): string {
  if (rate === null || rate === undefined || rate === '') return '—';
  const n = Number(rate);
  if (Number.isNaN(n)) return '—';
  return `${Number(n.toFixed(2))}%`;
}

/** Ngày sớm nhất được phép áp mức nền mới (hôm nay + 30 ngày), dạng `YYYY-MM-DD`. */
export function earliestBaseRateDate(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + BASE_RATE_NOTICE_DAYS);
  return d.toISOString().slice(0, 10);
}

/** Ưu đãi sắp hết hạn ⇒ tô cảnh báo + mời gia hạn (khớp cửa sổ gia hạn 30 ngày của backend). */
export function isAgreementExpiringSoon(daysRemaining: number): boolean {
  return daysRemaining <= 30;
}
