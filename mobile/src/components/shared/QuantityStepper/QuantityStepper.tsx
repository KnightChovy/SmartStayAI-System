import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';

const NAVY = '#0B1D45';

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
        className={`w-9 h-9 rounded-full border items-center justify-center ${canDec ? 'border-navy' : 'border-gray-200'}`}
      >
        <Ionicons name="remove" size={18} color={canDec ? NAVY : '#D1D5DB'} />
      </Pressable>
      <Text bold className="text-navy text-base w-6 text-center">{value}</Text>
      <Pressable
        disabled={!canInc}
        onPress={() => canInc && onChange(value + 1)}
        className={`w-9 h-9 rounded-full border items-center justify-center ${canInc ? 'border-navy' : 'border-gray-200'}`}
      >
        <Ionicons name="add" size={18} color={canInc ? NAVY : '#D1D5DB'} />
      </Pressable>
    </View>
  );
}
