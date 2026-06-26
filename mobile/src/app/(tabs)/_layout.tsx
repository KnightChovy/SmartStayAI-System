import { Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';

interface TabRoute {
  key: string;
  name: string;
}

interface CustomTabBarProps {
  state: { index: number; routes: TabRoute[] };
  navigation: { navigate: (name: string) => void };
}

function TabGlyph({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#1D6E5B' : '#A7B8B2';
  const common = {
    stroke: color,
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'index')
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"
          fill="none"
          {...common}
        />
        <Path d="M9 21v-7h6v7" fill="none" {...common} />
      </Svg>
    );
  if (name === 'search')
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d="m21 21-4.35-4.35" fill="none" {...common} />
        <Path
          d="M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
          fill="none"
          {...common}
        />
      </Svg>
    );
  if (name === 'bookings')
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
          fill="none"
          {...common}
        />
        <Path d="M8 2v4M16 2v4M3 10h18M8 14h3M8 17h6" fill="none" {...common} />
      </Svg>
    );
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M20 21a8 8 0 0 0-16 0" fill="none" {...common} />
      <Path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" fill="none" {...common} />
    </Svg>
  );
}

function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const [itemWidth, setItemWidth] = useState(0);
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (itemWidth > 0)
      indicatorX.value = withSpring(state.index * itemWidth, {
        damping: 22,
        stiffness: 220,
        mass: 0.7,
      });
  }, [indicatorX, itemWidth, state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      onLayout={event =>
        setItemWidth(
          (event.nativeEvent.layout.width - 16) / state.routes.length
        )
      }
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        borderRadius: 35,
        borderWidth: 1,
        borderColor: '#E6EEEB',
        backgroundColor: 'rgba(255,255,255,0.97)',
        boxShadow: '0 6px 16px rgba(16, 18, 12, 0.08)',
      }}
    >
      {itemWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 8,
              top: 10,
              width: itemWidth,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            },
            indicatorStyle,
          ]}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#DDF1E8',
            }}
          />
        </Animated.View>
      ) : null}
      {state.routes.map((route, index) => {
        const active = state.index === index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={route.name}
            accessibilityState={active ? { selected: true } : {}}
            onPress={() => navigation.navigate(route.name)}
            style={{
              zIndex: 1,
              flex: 1,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TabGlyph name={route.name} active={active} />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => (
        <CustomTabBar state={props.state} navigation={props.navigation} />
      )}
      screenOptions={{ headerShown: false, animation: 'shift' }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

