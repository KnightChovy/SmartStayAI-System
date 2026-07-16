import { isStaff, STAFF_HOME } from '@/constants/roles';
import { GUEST_COLORS } from '@/constants/guestTheme';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<
  string,
  { active: IoniconsName; inactive: IoniconsName; label: string }
> = {
  index: { active: 'home', inactive: 'home-outline', label: 'Trang chủ' },
  search: { active: 'search', inactive: 'search-outline', label: 'Tìm kiếm' },
  bookings: {
    active: 'calendar',
    inactive: 'calendar-outline',
    label: 'Đặt phòng',
  },
  chatbot: {
    active: 'chatbubble',
    inactive: 'chatbubble-outline',
    label: 'Trò chuyện',
  },
  profile: { active: 'person', inactive: 'person-outline', label: 'Tài khoản' },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: GUEST_COLORS.surface,
        borderTopWidth: 1,
        // Viền tóc ~30% — đúng cách client dựng ranh giới (border-outline-variant/30).
        borderTopColor: `${GUEST_COLORS.hairline}4D`,
        paddingTop: 8,
        paddingBottom: bottom + 8,
        paddingHorizontal: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;
        const focused = state.index === index;

        function onPress() {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented)
            navigation.navigate(route.name);
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 4,
              gap: 3,
            }}
          >
            <View
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                // Pill nền `surface-container` cho tab đang mở — cùng cách client
                // đánh dấu mục active (nền chìm, không phải màu rực).
                backgroundColor: focused ? GUEST_COLORS.surfaceContainer : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={focused ? config.active : config.inactive}
                size={22}
                color={focused ? GUEST_COLORS.onSurface : GUEST_COLORS.muted}
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                fontFamily: focused ? 'BeVietnamPro_600SemiBold' : 'BeVietnamPro_400Regular',
                color: focused ? GUEST_COLORS.onSurface : GUEST_COLORS.muted,
              }}
            >
              {config.label}
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
