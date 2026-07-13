import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { STAFF_COLORS } from '@/constants/staffTheme';
import { StaffButton } from '@/components/staff/StaffButton';
import { cn } from '@/lib/cn';

export interface StaffEmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  /** Icon tone: muted grey (default), brand teal, or danger red. */
  tone?: 'muted' | 'brand' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
}

const CIRCLE: Record<NonNullable<StaffEmptyStateProps['tone']>, string> = {
  muted: 'bg-gray-100',
  brand: 'bg-staff-50',
  danger: 'bg-rose-50',
};

const ICON_COLOR: Record<NonNullable<StaffEmptyStateProps['tone']>, string> = {
  muted: STAFF_COLORS.gray,
  brand: STAFF_COLORS.primary,
  danger: '#F43F5E',
};

/** Shared empty / error / load-failed state for staff screens. */
export function StaffEmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle,
  tone = 'muted',
  actionLabel,
  onAction,
}: StaffEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-10 py-16">
      <View className={cn('h-20 w-20 items-center justify-center rounded-full', CIRCLE[tone])}>
        <Ionicons name={icon} size={38} color={ICON_COLOR[tone]} />
      </View>
      <Text bold className="text-gray-800 text-lg text-center mt-5">
        {title}
      </Text>
      {subtitle ? (
        <Text size="sm" className="text-gray-400 text-center mt-1.5 leading-5">
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <StaffButton
          label={actionLabel}
          variant="outline"
          onPress={onAction}
          className="mt-6 px-8"
        />
      ) : null}
    </View>
  );
}
