import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';

const NAVY = '#0B1D45';

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
    <View className={`bg-white rounded-2xl overflow-hidden ${className ?? ''}`}>
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          className={`flex-row items-center px-4 py-3.5 ${index < items.length - 1 ? 'border-b border-gray-100' : ''}`}
        >
          <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mr-3">
            <Ionicons name={item.icon} size={18} color={NAVY} />
          </View>
          <View className="flex-1">
            <Text bold className="text-navy text-sm">
              {item.label}
            </Text>
            {item.sub && (
              <Text size="xs" className="text-gray-400 mt-0.5">
                {item.sub}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </Pressable>
      ))}
    </View>
  );
}
