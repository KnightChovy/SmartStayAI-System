import { View } from 'react-native';
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
  className?: string;
}

/** Hàng sao đánh giá dùng chung (thay cho `StarRow` lặp ở nhiều màn hình). */
export function StarRating({ count, total = 5, size = 12, color = GUEST_COLORS.bronze, className }: StarRatingProps) {
  return (
    <View className={`flex-row gap-0.5 ${className ?? ''}`}>
      {Array.from({ length: total }).map((_, i) => (
        <Ionicons key={i} name={i < count ? 'star' : 'star-outline'} size={size} color={color} />
      ))}
    </View>
  );
}
