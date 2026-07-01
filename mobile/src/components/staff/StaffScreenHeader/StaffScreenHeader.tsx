import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export interface StaffScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Hiện nút back (dùng cho màn chi tiết). */
  onBack?: () => void;
  /** Node tuỳ biến bên phải (vd nút, badge). */
  right?: React.ReactNode;
  /** Bỏ safe-area top khi header nằm trong màn đã có inset. */
  flat?: boolean;
  className?: string;
}

/** Header nền teal dùng chung cho mọi màn staff — đồng nhất nhận diện portal. */
export function StaffScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  flat = false,
  className,
}: StaffScreenHeaderProps) {
  const inner = (
    <View className="flex-row items-center px-5 pb-4 pt-3 gap-3">
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <View className="flex-1">
        <Heading size="xl" className="text-white">
          {title}
        </Heading>
        {subtitle ? (
          <Text size="sm" className="text-staff-100 mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View>{right}</View> : null}
    </View>
  );

  if (flat) {
    return <View className={cn('bg-staff-800', className)}>{inner}</View>;
  }
  return (
    <SafeAreaView edges={['top']} className={cn('bg-staff-800', className)}>
      {inner}
    </SafeAreaView>
  );
}
