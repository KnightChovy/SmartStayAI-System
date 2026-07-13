import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

type StaffButtonVariant = 'primary' | 'outline' | 'danger' | 'subtle';
type StaffButtonSize = 'md' | 'sm';

export interface StaffButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: StaffButtonVariant;
  size?: StaffButtonSize;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const CONTAINER: Record<StaffButtonVariant, string> = {
  primary: 'bg-staff-700 active:bg-staff-800',
  outline: 'bg-white border border-staff-200 active:bg-staff-50',
  danger: 'bg-rose-500 active:bg-rose-600',
  subtle: 'bg-staff-50 active:bg-staff-100',
};

const LABEL: Record<StaffButtonVariant, string> = {
  primary: 'text-white',
  outline: 'text-staff-700',
  danger: 'text-white',
  subtle: 'text-staff-700',
};

const ICON_COLOR: Record<StaffButtonVariant, string> = {
  primary: '#FFFFFF',
  outline: '#0F766E',
  danger: '#FFFFFF',
  subtle: '#0F766E',
};

const FILLED = new Set<StaffButtonVariant>(['primary', 'danger']);

/** Primary action button in the staff teal system — loading + icon + subtle depth. */
export function StaffButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className,
  style,
  ...rest
}: StaffButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-2xl',
        size === 'md' ? 'py-4 px-5' : 'py-2.5 px-4',
        CONTAINER[variant],
        isDisabled && 'opacity-50',
        className
      )}
      style={[
        FILLED.has(variant) && !isDisabled
          ? {
              shadowColor: variant === 'danger' ? '#F43F5E' : '#0F766E',
              shadowOpacity: 0.28,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 3,
            }
          : undefined,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <Spinner color={ICON_COLOR[variant]} />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={size === 'md' ? 18 : 16} color={ICON_COLOR[variant]} />
          ) : null}
          <Text bold size={size === 'sm' ? 'sm' : 'md'} className={LABEL[variant]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
