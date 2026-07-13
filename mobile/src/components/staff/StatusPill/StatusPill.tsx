import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { StatusStyle } from '@/constants/staffTheme';

export interface StatusPillProps {
  style: StatusStyle;
  size?: 'sm' | 'md';
}

/**
 * Generic status pill with a leading dot — takes a `StatusStyle` (bg/text/dot classes)
 * from the maps in `staffTheme` (room / housekeeping / conversation). Booking status uses
 * `BookingStatusBadge`.
 */
export function StatusPill({ style, size = 'sm' }: StatusPillProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-1.5 rounded-full self-start',
        size === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1',
        style.bg
      )}
    >
      <View className={cn('rounded-full', size === 'md' ? 'h-2 w-2' : 'h-1.5 w-1.5', style.dot)} />
      <Text size={size === 'md' ? 'xs' : '2xs'} bold className={style.text}>
        {style.label}
      </Text>
    </View>
  );
}
