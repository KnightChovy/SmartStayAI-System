import { View, type ViewProps } from 'react-native';
import { CARD_SHADOW } from '@/constants/staffTheme';
import { cn } from '@/lib/cn';

export interface CardProps extends ViewProps {
  /** Bỏ shadow (khi card nằm trong nền tối / lồng nhau). */
  flat?: boolean;
  className?: string;
}

/** Surface trắng bo tròn, shadow mềm — khối dựng UI cơ bản của staff portal. */
export function Card({
  flat = false,
  className,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      className={cn(
        'bg-white rounded-3xl border border-gray-100/80',
        className,
      )}
      style={[flat ? undefined : CARD_SHADOW, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
