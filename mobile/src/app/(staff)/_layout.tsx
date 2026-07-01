import { CUSTOMER_HOME, isStaff } from '@/constants/roles';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAVY = '#0B1D45';
const GRAY = '#9CA3AF';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

/** `center: true` → render nút nổi cao ở giữa (Check-in quét mã). */
const TAB_CONFIG: Record<
  string,
  {
    active: IoniconsName;
    inactive: IoniconsName;
    label: string;
    center?: boolean;
  }
> = {
  bookings: {
    active: 'calendar',
    inactive: 'calendar-outline',
    label: 'Bookings',
  },
  inbox: {
    active: 'chatbubbles',
    inactive: 'chatbubbles-outline',
    label: 'Inbox',
  },
  scan: {
    active: 'qr-code',
    inactive: 'qr-code',
    label: 'Check-in',
    center: true,
  },
  refunds: { active: 'cash', inactive: 'cash-outline', label: 'Refunds' },
  profile: { active: 'person', inactive: 'person-outline', label: 'Account' },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
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

        // Nút Check-in (scan) — nổi cao ở giữa cho dễ thao tác nhất.
        if (config.center) {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: NAVY,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -24,
                  borderWidth: 4,
                  borderColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Ionicons name="qr-code" size={26} color="#FFFFFF" />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: focused ? '700' : '500',
                  color: focused ? NAVY : GRAY,
                  marginTop: 4,
                }}
              >
                {config.label}
              </Text>
            </Pressable>
          );
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
                backgroundColor: focused ? '#E8EEF9' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={focused ? config.active : config.inactive}
                size={22}
                color={focused ? NAVY : GRAY}
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? '700' : '500',
                color: focused ? NAVY : GRAY,
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

export default function StaffTabsLayout() {
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();

  if (_hasHydrated && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (_hasHydrated && !isStaff(user?.role)) {
    return <Redirect href={CUSTOMER_HOME} />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="refunds" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
