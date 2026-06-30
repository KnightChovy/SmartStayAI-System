import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { BookingStatus } from '@/types/bookings.type';

/** Cấu hình nhãn + màu cho từng trạng thái booking (dùng chung list + detail). */
export const BOOKING_STATUS_STYLE: Record<
  BookingStatus,
  { label: string; bg: string; text: string }
> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#B45309' },
  confirmed: { label: 'Confirmed', bg: '#DBEAFE', text: '#1D4ED8' },
  checked_in: { label: 'Checked in', bg: '#DCFCE7', text: '#16A34A' },
  checked_out: { label: 'Completed', bg: '#F3F4F6', text: '#6B7280' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#DC2626' },
  no_show: { label: 'No show', bg: '#F3F4F6', text: '#6B7280' },
};

export interface BookingStatusBadgeProps {
  status: BookingStatus;
  /** size "sm" cho thẻ list, "md" cho màn detail. */
  size?: 'sm' | 'md';
}

/** Pill trạng thái booking — màu theo trạng thái, tái sử dụng nhiều màn. */
export function BookingStatusBadge({ status, size = 'sm' }: BookingStatusBadgeProps) {
  const style = BOOKING_STATUS_STYLE[status];
  const pad = size === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1';
  return (
    <View className={`rounded-full ${pad}`} style={{ backgroundColor: style.bg }}>
      <Text size={size === 'md' ? 'xs' : '2xs'} bold style={{ color: style.text }}>
        {style.label}
      </Text>
    </View>
  );
}
