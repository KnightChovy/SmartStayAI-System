import { isStaff, STAFF_HOME } from '@/constants/roles';
import { GUEST_COLORS } from '@/constants/guestTheme';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

/** `labelKey` trỏ vào `common:tabs.*` — nhãn dịch lúc render để đổi ngôn ngữ ăn ngay. */
const TAB_CONFIG: Record<
  string,
  { active: IoniconsName; inactive: IoniconsName; labelKey: 'home' | 'search' | 'bookings' | 'chat' | 'account' }
> = {
  index: { active: 'home', inactive: 'home-outline', labelKey: 'home' },
  search: { active: 'search', inactive: 'search-outline', labelKey: 'search' },
  bookings: {
    active: 'calendar',
    inactive: 'calendar-outline',
    labelKey: 'bookings',
  },
  chatbot: {
    active: 'chatbubble',
    inactive: 'chatbubble-outline',
    labelKey: 'chat',
  },
  profile: { active: 'person', inactive: 'person-outline', labelKey: 'account' },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation('common');

  return (
    <View
      className="flex-row items-center justify-around border-t px-2"
      style={{
        backgroundColor: GUEST_COLORS.surface,
        borderColor: `${GUEST_COLORS.hairline}4D`,
        height: 66 + bottom + 8,
        paddingTop: 8,
        paddingBottom: bottom + 8,
      }}
    >
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;
        const focused = state.index === index;
        const isCenterTab = route.name === 'bookings';
        const label = t(`tabs.${config.labelKey}`);

        function onPress() {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }

        function onLongPress() {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        }

        if (isCenterTab) {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              className="h-full w-[76px] items-center justify-center gap-1"
            >
              <View
                className="-mt-[30px] h-[58px] w-[58px] items-center justify-center rounded-full shadow-lg"
                style={{
                  backgroundColor: focused ? GUEST_COLORS.onSurface : GUEST_COLORS.brand,
                  elevation: 12,
                  shadowColor: GUEST_COLORS.brand,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.45,
                  shadowRadius: 10,
                }}
              >
                <Ionicons name={focused ? config.active : config.inactive} size={28} color={GUEST_COLORS.onBrand} />
              </View>
              <Text
                className="text-[10px]"
                style={{ fontFamily: 'BeVietnamPro_600SemiBold', color: GUEST_COLORS.brand }}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={onPress}
            onLongPress={onLongPress}
            className="h-full flex-1 items-center justify-center gap-[3px]"
          >
            <Ionicons
              name={focused ? config.active : config.inactive}
              size={23}
              color={focused ? GUEST_COLORS.brand : GUEST_COLORS.muted}
            />
            <Text
              className="text-[10px]"
              style={{
                fontFamily: focused ? 'BeVietnamPro_600SemiBold' : 'BeVietnamPro_400Regular',
                color: focused ? GUEST_COLORS.brand : GUEST_COLORS.muted,
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();

  if (_hasHydrated && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (_hasHydrated && isStaff(user?.role)) {
    return <Redirect href={STAFF_HOME} />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="chatbot" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
