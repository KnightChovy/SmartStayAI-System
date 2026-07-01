import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { STAFF_COLORS } from '@/constants/staffTheme';
import { StaffButton } from '@/components/staff/StaffButton';

export interface StaffEmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  /** Tông màu icon: mặc định xám; 'brand' cho teal; 'danger' cho lỗi. */
  tone?: 'muted' | 'brand' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
}

const ICON_COLOR: Record<NonNullable<StaffEmptyStateProps['tone']>, string> = {
  muted: STAFF_COLORS.grayLight,
  brand: STAFF_COLORS.primary,
  danger: '#F43F5E',
};

/** Trạng thái rỗng/lỗi/loading-fail dùng chung cho các màn staff. */
export function StaffEmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle,
  tone = 'muted',
  actionLabel,
  onAction,
}: StaffEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Ionicons name={icon} size={56} color={ICON_COLOR[tone]} />
      <Text bold className="text-gray-600 text-base text-center mt-4">
        {title}
      </Text>
      {subtitle ? (
        <Text size="sm" className="text-gray-400 text-center mt-1">
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <StaffButton
          label={actionLabel}
          variant="outline"
          onPress={onAction}
          className="mt-5 px-8"
        />
      ) : null}
    </View>
  );
}
