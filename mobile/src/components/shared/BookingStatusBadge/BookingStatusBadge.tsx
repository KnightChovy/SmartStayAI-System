import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import type { BookingStatus } from '@/types/bookings.type';

/**
 * Màu cho từng trạng thái booking (dùng chung list + detail).
 * Nhãn KHÔNG nằm ở đây nữa — nó lấy từ `booking:status.*` lúc render, vì hằng ở
 * module scope sẽ đóng băng ngôn ngữ tại thời điểm import.
 */
export const BOOKING_STATUS_STYLE: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#B45309' },
  confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
  checked_in: { bg: '#DCFCE7', text: '#16A34A' },
  checked_out: { bg: '#F3F4F6', text: '#6B7280' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  no_show: { bg: '#F3F4F6', text: '#6B7280' },
};

export interface BookingStatusBadgeProps {
  status: BookingStatus;
  /** size "sm" cho thẻ list, "md" cho màn detail. */
  size?: 'sm' | 'md';
}

/** Pill trạng thái booking — màu theo trạng thái, tái sử dụng nhiều màn. */
export function BookingStatusBadge({ status, size = 'sm' }: BookingStatusBadgeProps) {
  const { t } = useTranslation('booking');
  const style = BOOKING_STATUS_STYLE[status];
  const pad = size === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1';
  return (
    <View className={`rounded-full ${pad}`} style={{ backgroundColor: style.bg }}>
      <Text className="font-bevi-bold" size={size === 'md' ? 'xs' : '2xs'} style={{ color: style.text }}>
        {t(`status.${status}`)}
      </Text>
    </View>
  );
}
