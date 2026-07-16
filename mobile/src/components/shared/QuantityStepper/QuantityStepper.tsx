import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { GUEST_COLORS } from '@/constants/guestTheme';


export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/** Bộ tăng/giảm số lượng (vd số khách) — viền tròn, tông navy. */
export function QuantityStepper({ value, onChange, min = 1, max = 20 }: QuantityStepperProps) {
  const canDec = value > min;
  const canInc = value < max;
  return (
    <View className="flex-row items-center gap-4">
      <Pressable
        disabled={!canDec}
        onPress={() => canDec && onChange(value - 1)}
        className={`w-9 h-9 rounded-full border items-center justify-center ${canDec ? 'border-on-surface' : 'border-hairline/50'}`}
      >
        <Ionicons name="remove" size={18} color={canDec ? GUEST_COLORS.onSurface : GUEST_COLORS.hairline} />
      </Pressable>
      <Text bold className="font-bevi-bold text-on-surface text-base w-6 text-center">{value}</Text>
      <Pressable
        disabled={!canInc}
        onPress={() => canInc && onChange(value + 1)}
        className={`w-9 h-9 rounded-full border items-center justify-center ${canInc ? 'border-on-surface' : 'border-hairline/50'}`}
      >
        <Ionicons name="add" size={18} color={canInc ? GUEST_COLORS.onSurface : GUEST_COLORS.hairline} />
      </Pressable>
    </View>
  );
}
