import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { StatusStyle } from '@/constants/staffTheme';

export interface StatusPillProps {
  style: StatusStyle;
  size?: 'sm' | 'md';
}

/**
 * Pill trạng thái tổng quát — nhận `StatusStyle` (class nền + chữ) từ các map trong
 * `staffTheme` (phòng, housekeeping, hội thoại). Booking status dùng `BookingStatusBadge`.
 */
export function StatusPill({ style, size = 'sm' }: StatusPillProps) {
  return (
    <View
      className={cn(
        'rounded-full self-start',
        size === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1',
        style.bg
      )}
    >
      <Text size={size === 'md' ? 'xs' : '2xs'} bold className={style.text}>
        {style.label}
      </Text>
    </View>
  );
}
