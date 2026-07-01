import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

type StaffButtonVariant = 'primary' | 'outline' | 'danger' | 'subtle';

export interface StaffButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: StaffButtonVariant;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  className?: string;
}

const CONTAINER: Record<StaffButtonVariant, string> = {
  primary: 'bg-staff-700 active:bg-staff-800',
  outline: 'bg-white border border-staff-600 active:bg-staff-50',
  danger: 'bg-rose-600 active:bg-rose-700',
  subtle: 'bg-staff-50 active:bg-staff-100',
};

const LABEL: Record<StaffButtonVariant, string> = {
  primary: 'text-white',
  outline: 'text-staff-700',
  danger: 'text-white',
  subtle: 'text-staff-700',
};

const SPINNER_COLOR: Record<StaffButtonVariant, string> = {
  primary: '#FFFFFF',
  outline: '#0F766E',
  danger: '#FFFFFF',
  subtle: '#0F766E',
};

/** Nút hành động theo tông teal của staff portal. Có trạng thái loading + icon. */
export function StaffButton({
  label,
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  className,
  ...rest
}: StaffButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-2xl py-4 px-5',
        CONTAINER[variant],
        isDisabled && 'opacity-50',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner color={SPINNER_COLOR[variant]} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#0F766E'}
            />
          ) : null}
          <Text bold className={LABEL[variant]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
