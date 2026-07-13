import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/staff/Card';
import { cn } from '@/lib/cn';

export interface QuickActionProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  /** Optional numeric badge (e.g. escalated count). */
  badge?: number;
}

/** Compact quick-action tile used in the dashboard actions row. */
export function QuickAction({ icon, label, onPress, badge }: QuickActionProps) {
  return (
    <Pressable onPress={onPress} className="flex-1 active:opacity-90">
      <Card className="py-4 items-center">
        <View className="h-11 w-11 rounded-2xl bg-staff-50 items-center justify-center">
          <Ionicons name={icon} size={22} color="#0F766E" />
          {badge && badge > 0 ? (
            <View className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 items-center justify-center">
              <Text size="2xs" bold className="text-white">
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text size="xs" bold className="text-gray-700 mt-2">
          {label}
        </Text>
      </Card>
    </Pressable>
  );
}
