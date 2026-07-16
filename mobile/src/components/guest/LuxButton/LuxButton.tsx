import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { GUEST_COLORS } from '@/constants/guestTheme';

type LuxButtonVariant = 'primary' | 'outline' | 'ghost';

interface LuxButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: LuxButtonVariant;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

/**
 * CTA của guest — dạng viên thuốc (`rounded-full`), chữ HOA giãn rộng, nền gần đen
 * (`on-surface`). Đây là nút thật mà client dùng ở mọi màn khách (Login/Hero/Navbar),
 * chứ không phải `size="default"` (cao 32px) của shadcn — quá nhỏ để chạm trên điện thoại.
 */
export function LuxButton({
  label,
  variant = 'primary',
  loading = false,
  icon,
  className,
  disabled,
  ...pressableProps
}: LuxButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        // min-h-14: mục tiêu chạm thoải mái, cao hơn hẳn mức tối thiểu 44pt.
        'min-h-14 flex-row items-center justify-center gap-2 rounded-full px-6',
        variant === 'primary' && 'bg-on-surface',
        variant === 'outline' && 'border border-hairline bg-surface-lowest',
        variant === 'ghost' && 'bg-transparent',
        isDisabled && 'opacity-40',
        className
      )}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? GUEST_COLORS.white : GUEST_COLORS.onSurface} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={variant === 'primary' ? GUEST_COLORS.white : GUEST_COLORS.onSurface}
            />
          ) : null}
          <Text
            className={cn(
              'font-bevi-bold uppercase tracking-[1.5px]',
              variant === 'primary' ? 'text-white' : 'text-on-surface'
            )}
            size="sm"
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
