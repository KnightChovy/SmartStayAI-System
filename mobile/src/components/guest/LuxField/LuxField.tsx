import { forwardRef } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { GUEST_COLORS, PLACEHOLDER } from '@/constants/guestTheme';

interface LuxFieldProps extends TextInputProps {
  /** Nhãn viết HOA, giãn chữ — đúng `text-label-sm` của client. */
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Hiện nút con mắt (ô mật khẩu). */
  onToggleSecure?: () => void;
  secureVisible?: boolean;
  containerClassName?: string;
}

/**
 * Ô nhập của guest — theo đúng spec client (`LoginPage`): cao 48, bo `rounded-xl`
 * (16.8px), nền `surface-container-low`, viền tóc `outline-variant/60`, viền đổi sang
 * `brand` khi focus.
 *
 * Dùng `TextInput` thuần chứ KHÔNG dùng `components/ui/input` của gluestack —
 * component đó crash trong setup này (css-interop truyền animated style vào View
 * thuần), xem PROGRESS.md 13/7.
 */
export const LuxField = forwardRef<TextInput, LuxFieldProps>(function LuxField(
  { label, error, icon, onToggleSecure, secureVisible, containerClassName, ...inputProps },
  ref
) {
  return (
    <View className={cn('mb-4', containerClassName)}>
      <Text className="mb-2 font-bevi-bold uppercase tracking-[1.2px] text-on-surface-variant" size="xs">
        {label}
      </Text>

      <View
        className={cn(
          'h-12 flex-row items-center rounded-field border bg-surface-low px-4',
          error ? 'border-danger' : 'border-hairline/60'
        )}
      >
        {icon ? <Ionicons name={icon} size={18} color={GUEST_COLORS.muted} style={{ marginRight: 10 }} /> : null}

        <TextInput
          ref={ref}
          placeholderTextColor={PLACEHOLDER}
          className="h-full flex-1 font-bevi text-[15px] text-on-surface"
          {...inputProps}
        />

        {onToggleSecure ? (
          <Pressable
            onPress={onToggleSecure}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={secureVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <Ionicons
              name={secureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={GUEST_COLORS.muted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text className="ml-1 mt-1.5 font-bevi-semibold text-danger" size="xs">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
