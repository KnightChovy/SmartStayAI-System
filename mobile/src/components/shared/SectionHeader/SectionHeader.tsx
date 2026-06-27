import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';

export interface SectionHeaderProps {
  title: string;
  /** Nhãn hành động bên phải (vd "See more"). */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/** Tiêu đề một mục kèm hành động tuỳ chọn bên phải. */
export function SectionHeader({ title, actionLabel, onAction, className }: SectionHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between px-1 mb-2 mt-5 ${className ?? ''}`}>
      <Text bold className="text-navy text-base">
        {title}
      </Text>
      {actionLabel && (
        <Pressable onPress={onAction}>
          <Text size="sm" bold className="text-gold">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
