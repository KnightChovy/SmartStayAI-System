import type { ConversationStatus } from '@/types/chat.types';
import type { StaffConversationCustomer } from '@/types/staff-conversation.types';

/**
 * Nhãn trạng thái theo góc nhìn nhân viên trực (đặt tên kiểu Booking.com Extranet: nói việc cần làm,
 * không nói trạng thái kỹ thuật). 'escalated' = khách đang xếp hàng chờ người thật ⇒ "Needs reply".
 */
export const CONVERSATION_STATUS_META: Record<
  ConversationStatus,
  { label: string; className: string; dot: string }
> = {
  escalated: {
    label: 'Needs reply',
    className: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  active: {
    label: 'Open',
    className: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  closed: {
    label: 'Closed',
    className: 'bg-slate-200 text-slate-700',
    dot: 'bg-slate-400',
  },
};

/** Tab lọc. 'all' không phải trạng thái của BE nên xử lý riêng khi lọc. */
export type ConversationFilter = ConversationStatus | 'all';

export const CONVERSATION_FILTERS: {
  value: ConversationFilter;
  label: string;
  empty: string;
}[] = [
  {
    value: 'escalated',
    label: 'Needs reply',
    empty: 'No one is waiting for a reply right now.',
  },
  { value: 'active', label: 'Open', empty: 'No open conversations.' },
  { value: 'resolved', label: 'Resolved', empty: 'Nothing resolved yet.' },
  { value: 'all', label: 'All', empty: 'No guest has messaged this hotel yet.' },
];

/** Tên khách để hiển thị; khách vãng lai (chưa đăng nhập) không có bản ghi user nào. */
export const customerName = (
  customer: StaffConversationCustomer | null
): string => customer?.fullName?.trim() || customer?.email || 'Guest';

/** Chữ cái đầu cho avatar; tối đa 2 ký tự như Booking.com. */
export const customerInitials = (
  customer: StaffConversationCustomer | null
): string => {
  const name = customerName(customer);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
