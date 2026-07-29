import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { HotelCard } from '@/components/shared/HotelCard';
import { StayPickerSheet } from '@/components/shared/StayPickerSheet';
import { LuxButton } from '@/components/guest';
import { useGetHotels } from '@/hooks/hotels';
import { useAuthStore } from '@/stores/authStore';
import { getInitials } from '@/utils/hotel';
import {
  formatDateShort,
  todayKey,
  toDateKey,
  addDays,
} from '@/utils/formatDate';
import { DESTINATIONS } from '@/constants/destinations';
import {
  GUEST_COLORS,
  HOME_HERO_IMAGE,
  PLACEHOLDER,
} from '@/constants/guestTheme';

const PROPERTY_TYPES = [
  { id: '1', labelKey: 'hotels', icon: 'bed-outline' as const },
  { id: '2', labelKey: 'apartments', icon: 'business-outline' as const },
  { id: '3', labelKey: 'resorts', icon: 'umbrella-outline' as const },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation(['home', 'common']);
  const [destination, setDestination] = useState('');
  const [activeType, setActiveType] = useState('1');
  const [checkIn, setCheckIn] = useState(todayKey());
  const [checkOut, setCheckOut] = useState(toDateKey(addDays(todayKey(), 1)));
  const [guests, setGuests] = useState(2);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { top, bottom } = useSafeAreaInsets();

  const { user } = useAuthStore();
  const initials = getInitials(user?.fullName);

  // Dashboard phải lấy giá theo đúng kỳ ở khách đang chọn. Có checkIn/checkOut thì BE
  // áp pricing rule/deal, kiểm tra tồn kho và trả minPrice đã gồm thuế/phí thay vì giá niêm yết.
  const { data: hotelsData, isLoading } = useGetHotels({
    limit: 10,
    checkIn,
    checkOut,
    guests,
  });
  const hotels = hotelsData?.results ?? [];

  function goToSearch() {
    router.push({
      pathname: '/(tabs)/search',
      params: {
        ...(destination.trim() ? { city: destination.trim() } : {}),
        checkIn,
        checkOut,
        guests: String(guests),
      },
    });
  }

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />

      {/* Thanh trên: nền surface mờ như navbar của client (bg-surface/80), chữ đậm — không
          phải khối navy đặc như bản cũ. */}
      <View
        className="border-b border-hairline/30 bg-surface"
        style={{ paddingTop: top }}
      >
        <View className="flex-row items-center justify-between px-5 py-3">
          <Heading
            className="font-bevi-bold tracking-tight text-on-surface"
            size="lg"
          >
            StayHub
          </Heading>
          <View className="flex-row items-center gap-4">
            <Pressable
              hitSlop={8}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons
                name="notifications-outline"
                size={23}
                color={GUEST_COLORS.onSurface}
              />
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-surface bg-danger" />
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/profile')}>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-bronze/20">
                <Text className="font-bevi-bold text-bronze" size="xs">
                  {initials}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
      >
        {/* Hero: ảnh + phủ SÁNG dần (không phải phủ tối) để chữ đậm vẫn đọc được —
            đúng công thức Hero của client (from-surface/50 to-surface/35). */}
        <View className="pb-6">
          <View
            className="absolute left-0 right-0 top-0"
            style={{ height: 210 }}
          >
            <Image
              source={HOME_HERO_IMAGE}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={[
                'rgba(252,249,248,0.55)',
                'rgba(252,249,248,0.75)',
                'rgba(245,242,238,1)',
              ]}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View className="mb-5 px-5 pt-7">
            <Heading
              className="font-bevi-bold leading-9 text-on-surface"
              size="2xl"
            >
              {t('home:heroTitle')}
            </Heading>
            <Text className="mt-1 font-bevi text-on-surface-variant" size="sm">
              {t('home:heroSubtitle')}
            </Text>
          </View>

          {/* Thẻ tìm kiếm trắng nổi trên ảnh — chữ ký thị giác của Hero client. */}
          <View className="mx-5 rounded-panel border border-hairline/20 bg-surface-lowest p-4 shadow-lg">
            <View className="mb-3 h-12 flex-row items-center rounded-field border border-hairline/50 bg-surface-low px-3">
              <Ionicons
                name="location-outline"
                size={18}
                color={GUEST_COLORS.muted}
              />
              <TextInput
                className="ml-2 h-full flex-1 font-bevi text-[15px] text-on-surface"
                placeholder={t('home:destinationPlaceholder')}
                placeholderTextColor={PLACEHOLDER}
                value={destination}
                onChangeText={setDestination}
                returnKeyType="search"
                onSubmitEditing={goToSearch}
              />
            </View>

            <Pressable
              onPress={() => setPickerOpen(true)}
              className="mb-3 h-12 flex-row items-center rounded-field border border-hairline/50 bg-surface-low px-3"
            >
              <Ionicons
                name="calendar-outline"
                size={17}
                color={GUEST_COLORS.muted}
              />
              <Text
                className="ml-2 flex-1 font-bevi-medium text-on-surface"
                size="sm"
                numberOfLines={1}
              >
                {formatDateShort(checkIn)} → {formatDateShort(checkOut)}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={GUEST_COLORS.muted}
              />
            </Pressable>

            <Pressable
              onPress={() => setPickerOpen(true)}
              className="mb-4 h-12 flex-row items-center rounded-field border border-hairline/50 bg-surface-low px-3"
            >
              <Ionicons
                name="people-outline"
                size={17}
                color={GUEST_COLORS.muted}
              />
              <Text
                className="ml-2 flex-1 font-bevi-medium text-on-surface"
                size="sm"
              >
                {t('common:guests', { count: guests })}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={GUEST_COLORS.muted}
              />
            </Pressable>

            <LuxButton
              label={t('home:search')}
              icon="search"
              onPress={goToSearch}
            />
          </View>
        </View>

        <View className="px-4 pt-2">
          {/* Ưu đãi — dải nhấn đồng thay vì vàng chói, đúng tông client. */}
          <Pressable className="mb-6 flex-row items-center rounded-card border-l-4 border-bronze bg-bronze/10 p-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-field bg-bronze">
              <Ionicons name="flash" size={19} color={GUEST_COLORS.white} />
            </View>
            <View className="flex-1">
              <Text className="font-bevi-bold text-on-surface" size="sm">
                {t('home:deals.title')}
              </Text>
              <Text
                className="mt-0.5 font-bevi text-on-surface-variant"
                size="xs"
              >
                {t('home:deals.body')}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={GUEST_COLORS.bronze}
            />
          </Pressable>

          <Heading className="mb-3 font-bevi-bold text-on-surface" size="md">
            {t('home:propertyTypes.title')}
          </Heading>
          <View className="mb-6 flex-row gap-2">
            {PROPERTY_TYPES.map((type) => {
              const active = activeType === type.id;
              return (
                <Pressable
                  key={type.id}
                  onPress={() => setActiveType(type.id)}
                  className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 ${
                    active
                      ? 'border-on-surface bg-on-surface'
                      : 'border-hairline/60 bg-surface'
                  }`}
                >
                  <Ionicons
                    name={type.icon}
                    size={15}
                    color={
                      active
                        ? GUEST_COLORS.white
                        : GUEST_COLORS.onSurfaceVariant
                    }
                  />
                  <Text
                    className={`font-bevi-semibold ${active ? 'text-white' : 'text-on-surface'}`}
                    size="xs"
                  >
                    {t(`home:propertyTypes.${type.labelKey}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Heading className="font-bevi-bold text-on-surface" size="md">
              {t('home:explore.title')}
            </Heading>
            <Pressable
              onPress={() => router.push('/(tabs)/search')}
              hitSlop={8}
            >
              <Text className="font-bevi-semibold text-bronze" size="sm">
                {t('home:explore.seeAll')}
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={DESTINATIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(d) => d.id}
            contentContainerStyle={{
              gap: 10,
              paddingBottom: 4,
              marginBottom: 24,
            }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/search',
                    params: { city: item.city },
                  })
                }
                className="justify-end overflow-hidden rounded-card"
                style={{
                  width: 130,
                  height: 160,
                  backgroundColor: GUEST_COLORS.surfaceContainer,
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(28,27,27,0.75)']}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 90,
                  }}
                />
                <View className="p-3">
                  <Text className="font-bevi-bold text-white" size="sm">
                    {item.name}
                  </Text>
                  <Text className="font-bevi text-white/75" size="xs">
                    {item.tagline}
                  </Text>
                </View>
              </Pressable>
            )}
          />

          <Heading className="mb-3 font-bevi-bold text-on-surface" size="md">
            {t('home:favorites.title')}
          </Heading>
          {isLoading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={GUEST_COLORS.brand} />
            </View>
          ) : hotels.length === 0 ? (
            <View className="items-center gap-2 py-10">
              <Ionicons
                name="bed-outline"
                size={38}
                color={GUEST_COLORS.hairline}
              />
              <Text className="font-bevi text-muted" size="sm">
                {t('home:favorites.empty')}
              </Text>
            </View>
          ) : (
            hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onPress={() =>
                  router.push({
                    pathname: '/hotel/[id]',
                    params: { id: hotel.id, checkIn, checkOut, guests: String(guests) },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      <StayPickerSheet
        visible={pickerOpen}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialGuests={guests}
        onClose={() => setPickerOpen(false)}
        onApply={({ checkIn: ci, checkOut: co, guests: g }) => {
          setCheckIn(ci);
          setCheckOut(co);
          setGuests(g);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}
