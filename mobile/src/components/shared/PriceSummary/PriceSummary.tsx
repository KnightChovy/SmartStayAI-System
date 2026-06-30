import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatVnd } from '@/utils/formatCurrency';

export interface PriceLine {
  label: string;
  /** Giá trị (VND). Số âm hiển thị như khoản giảm. */
  value: string | number;
  muted?: boolean;
}

export interface PriceSummaryProps {
  lines: PriceLine[];
  total: string | number;
  className?: string;
}

/** Bảng tóm tắt giá: danh sách dòng + tổng cộng, định dạng VND. Dùng ở checkout / detail. */
export function PriceSummary({ lines, total, className }: PriceSummaryProps) {
  return (
    <View className={className}>
      {lines.map((line) => {
        const num = typeof line.value === 'string' ? Number(line.value) : line.value;
        const isDiscount = num < 0;
        return (
          <View key={line.label} className="flex-row items-center justify-between mb-2">
            <Text size="sm" className="text-gray-500">{line.label}</Text>
            <Text
              size="sm"
              className={isDiscount ? 'text-green-600' : line.muted ? 'text-gray-400' : 'text-navy'}
            >
              {isDiscount ? `- ${formatVnd(Math.abs(num))}` : formatVnd(line.value)}
            </Text>
          </View>
        );
      })}
      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3 mt-1">
        <Text bold className="text-navy">Total</Text>
        <Text bold className="text-navy text-lg">{formatVnd(total)}</Text>
      </View>
    </View>
  );
}
