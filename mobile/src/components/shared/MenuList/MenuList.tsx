import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { GUEST_COLORS } from '@/constants/guestTheme';


export interface MenuListItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sub?: string;
  onPress?: () => void;
}

export interface MenuListProps {
  items: MenuListItem[];
  className?: string;
}

/** Danh sách menu dạng thẻ trắng bo góc — mỗi dòng có icon, nhãn, mô tả phụ và chevron. */
export function MenuList({ items, className }: MenuListProps) {
  return (
    <View className={`bg-surface rounded-card overflow-hidden ${className ?? ''}`}>
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          className={`flex-row items-center px-4 py-3.5 ${index < items.length - 1 ? 'border-b border-hairline/30' : ''}`}
        >
          <View className="w-9 h-9 rounded-field bg-brand/10 items-center justify-center mr-3">
            <Ionicons name={item.icon} size={18} color={GUEST_COLORS.onSurface} />
          </View>
          <View className="flex-1">
            <Text bold className="font-bevi-bold text-on-surface text-sm">
              {item.label}
            </Text>
            {item.sub && (
              <Text size="xs" className="font-bevi text-muted mt-0.5">
                {item.sub}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={GUEST_COLORS.hairline} />
        </Pressable>
      ))}
    </View>
  );
}
