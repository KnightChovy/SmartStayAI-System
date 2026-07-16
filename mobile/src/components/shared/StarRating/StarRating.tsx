import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GUEST_COLORS } from '@/constants/guestTheme';

export interface StarRatingProps {
  /** Số sao được tô (filled). */
  count: number;
  /** Tổng số sao hiển thị. */
  total?: number;
  /** Kích thước mỗi icon sao. */
  size?: number;
  /** Màu sao. */
  color?: string;
  /**
   * Có truyền = chấm điểm được (chạm vào sao thứ n → gọi `onRate(n)`).
   * Không truyền = chỉ hiển thị, y như trước.
   */
  onRate?: (value: number) => void;
  /** Nhãn cho trình đọc màn hình khi ở chế độ chấm điểm (vd "Sạch sẽ"). */
  accessibilityLabel?: string;
  className?: string;
}

/** Hàng sao đánh giá dùng chung — hiển thị, hoặc chấm điểm khi có `onRate`. */
export function StarRating({
  count,
  total = 5,
  size = 12,
  color = GUEST_COLORS.bronze,
  onRate,
  accessibilityLabel,
  className,
}: StarRatingProps) {
  return (
    <View
      className={`flex-row gap-0.5 ${className ?? ''}`}
      accessibilityRole={onRate ? 'adjustable' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={onRate ? { min: 1, max: total, now: count } : undefined}
    >
      {Array.from({ length: total }).map((_, i) => {
        const value = i + 1;
        const icon = <Ionicons name={value <= count ? 'star' : 'star-outline'} size={size} color={color} />;
        if (!onRate) return <View key={i}>{icon}</View>;
        return (
          <Pressable
            key={i}
            onPress={() => onRate(value)}
            // Sao to ~28px vẫn dưới ngưỡng chạm 44pt → nới vùng chạm thay vì phóng icon.
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${value}/${total}`}
            className="p-0.5"
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}
