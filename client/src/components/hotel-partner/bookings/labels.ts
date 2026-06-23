import type {
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
} from '@/types/staff.types';

/** Display config cho trạng thái booking (label + class của Pill). */
export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; class: string }> = {
  pending: { label: 'Pending', class: 'bg-slate-100 text-slate-600' },
  confirmed: { label: 'Confirmed', class: 'bg-blue-100 text-blue-700' },
  checked_in: { label: 'Checked in', class: 'bg-emerald-100 text-emerald-700' },
  checked_out: { label: 'Checked out', class: 'bg-slate-100 text-slate-500' },
  cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
  no_show: { label: 'No-show', class: 'bg-amber-100 text-amber-700' },
};

export const BOOKING_STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No-show' },
];

/** Display config cho trạng thái thanh toán. */
export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; class: string }> = {
  pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', class: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Failed', class: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunded', class: 'bg-slate-100 text-slate-600' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  vnpay: 'VNPay',
  sepay: 'SePay',
  stripe: 'Stripe',
  cash: 'Cash',
};
