import { useEffect, useState } from 'react';
import { CUSTOMER_HOME, isStaff } from '@/constants/roles';
import { useAuthStore } from '@/stores/authStore';
import { useStaffStore } from '@/stores/staffStore';
import { useMyStaffHotels } from '@/hooks/staff';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs } from 'expo-router';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STAFF_GRADIENT } from '@/constants/staffTheme';

const NAVY = '#0F766E'; // staff-700 — staff portal brand (teal)
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
  dashboard: {
    active: 'grid',
    inactive: 'grid-outline',
    label: 'Home',
  },
  bookings: {
    active: 'calendar',
    inactive: 'calendar-outline',
    label: 'Bookings',
  },
  scan: {
    active: 'qr-code',
    inactive: 'qr-code',
    label: 'Check-in',
    center: true,
  },
  inbox: {
    active: 'chatbubbles',
    inactive: 'chatbubbles-outline',
    label: 'Inbox',
  },
  profile: { active: 'person', inactive: 'person-outline', label: 'Account' },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (isKeyboardVisible) return null;

  // Màn chi tiết (conversation/[id], bookings/[id], check-in/[id]…) không nằm trong
  // TAB_CONFIG — ẩn hẳn tab bar để chúng chiếm trọn window. Nếu để bar hiện rồi ẩn
  // lúc bàn phím lên, KeyboardAvoidingView đã đo khung theo chiều cao CŨ ⇒ padding
  // thiếu đúng bằng chiều cao tab bar và ô nhập bị bàn phím che.
  const activeRoute = state.routes[state.index];
  if (!activeRoute || !TAB_CONFIG[activeRoute.name]) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 10,
        paddingBottom: bottom + 8,
        paddingHorizontal: 8,
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -6 },
        elevation: 16,
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
              <LinearGradient
                colors={STAFF_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -26,
                  borderWidth: 4,
                  borderColor: '#FFFFFF',
                  shadowColor: '#0F766E',
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 5 },
                  elevation: 8,
                }}
              >
                <Ionicons name="qr-code" size={26} color="#FFFFFF" />
              </LinearGradient>
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
                backgroundColor: focused ? '#CCFBF1' : 'transparent',
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
  const hotelId = useStaffStore((s) => s.hotelId);
  const setHotelId = useStaffStore((s) => s.setHotelId);

  // Sau khi staff đăng nhập: tự lấy KS của tài khoản (`GET /hotels/mine`) và chốt hotelId
  // vận hành vào store. Chỉ set khi chưa có / hotelId cũ không còn hợp lệ.
  const canQuery = _hasHydrated && isAuthenticated && isStaff(user?.role);
  const { data: hotels } = useMyStaffHotels(canQuery);
  useEffect(() => {
    if (!hotels?.length) return;
    const stillValid = hotelId && hotels.some((h) => h.id === hotelId);
    if (!stillValid) setHotelId(hotels[0].id);
  }, [hotels, hotelId, setHotelId]);

  if (_hasHydrated && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (_hasHydrated && !isStaff(user?.role)) {
    return <Redirect href={CUSTOMER_HOME} />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
