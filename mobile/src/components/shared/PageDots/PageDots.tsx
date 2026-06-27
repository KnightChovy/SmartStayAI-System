import { View } from 'react-native';

export interface PageDotsProps {
  /** Chỉ số trang đang active. */
  current: number;
  /** Tổng số chấm. */
  count?: number;
  className?: string;
}

/** Chấm phân trang cho onboarding/carousel — chấm active dài ra. */
export function PageDots({ current, count = 2, className }: PageDotsProps) {
  return (
    <View className={`flex-row justify-center items-center gap-2 py-4 ${className ?? ''}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className={`h-2 rounded-full ${current === i ? 'w-6 bg-navy' : 'w-2 bg-gray-300'}`}
        />
      ))}
    </View>
  );
}
