import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { STAFF_GRADIENT } from '@/constants/staffTheme';

export interface StaffScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Back button (detail screens). */
  onBack?: () => void;
  /** Custom node on the right (button / badge). */
  right?: React.ReactNode;
  /** Extra content rendered below the title inside the gradient (filter chips, stats…). */
  children?: React.ReactNode;
  /** Larger hero title (used by the main tab screens). */
  large?: boolean;
}

/** Gradient teal header shared by every staff screen — consistent portal identity. */
export function StaffScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  children,
  large = false,
}: StaffScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={STAFF_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 6,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        shadowColor: '#0F766E',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <View className="flex-row items-center gap-3 px-5 pb-2 pt-2">
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
        ) : null}

        <View className="flex-1">
          <Heading size={large ? '2xl' : 'xl'} className="text-white">
            {title}
          </Heading>
          {subtitle ? (
            <Text size="sm" className="text-teal-50/90 mt-0.5">
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right ? <View>{right}</View> : null}
      </View>

      {children ? <View className="pb-4">{children}</View> : <View className="pb-3" />}
    </LinearGradient>
  );
}
