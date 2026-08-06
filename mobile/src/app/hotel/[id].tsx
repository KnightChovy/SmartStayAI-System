import { useState } from 'react';
import { View, ScrollView, Pressable, FlatList, ActivityIndicator, Dimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { StarRating } from '@/components/shared/StarRating';
import { RoomTypeCard } from '@/components/shared/RoomTypeCard';
import { StayPickerSheet } from '@/components/shared/StayPickerSheet';
import { HotelMap } from '@/components/shared/HotelMap';
import { HotelReviews } from '@/components/guest';
import { useGetHotel, useGetRoomTypes } from '@/hooks/hotels';
import { useHotelReviewStats } from '@/hooks/reviews';
import { useGeocode } from '@/hooks/geo';
import { getHotelLocation } from '@/utils/hotel';
import { formatDateShort, todayKey, toDateKey, addDays } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const CAROUSEL_H = 280;

export default function HotelDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation(['hotel', 'common']);
  const params = useLocalSearchParams<{
    id: string; checkIn?: string; checkOut?: string; guests?: string;
  }>();
  const id = params.id;
  const insets = useSafeAreaInsets();
  const [imageIndex, setImageIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Nhận ngày từ Search nếu có; mặc định hôm nay → mai để backend trả availableRooms/totalPrice ngay.
  const [checkIn, setCheckIn] = useState(params.checkIn ?? todayKey());
  const [checkOut, setCheckOut] = useState(params.checkOut ?? toDateKey(addDays(todayKey(), 1)));
  const [guests, setGuests] = useState(params.guests ? Number(params.guests) : 2);

  const { data: hotel, isLoading } = useGetHotel(id);
  const { data: roomTypes } = useGetRoomTypes(id, { checkIn, checkOut, guests });
  // Danh sách review do <HotelReviews/> tự tải; ở đây chỉ cần điểm + số lượng cho phần header.
  const { data: reviewStats } = useHotelReviewStats(id);

  // Toạ độ map: ưu tiên DB; nếu seed chưa có lat/lng thì geocode từ địa chỉ (VietMap).
  const fullAddress = hotel ? `${hotel.address}, ${getHotelLocation(hotel)}` : '';
  const hasDbCoords = Boolean(hotel?.latitude && hotel?.longitude);
  const { data: geocoded } = useGeocode(fullAddress, Boolean(hotel) && !hasDbCoords);
  const mapLat = hotel?.latitude ?? geocoded?.lat ?? null;
  const mapLng = hotel?.longitude ?? geocoded?.lng ?? null;

  const rooms = roomTypes ?? [];
  // Điểm + tổng số lấy từ endpoint thống kê (tính trên TOÀN BỘ đánh giá đã duyệt).
  // Trước đây tự cộng trung bình của đúng 5 review vừa tải → khách sạn có 100 đánh giá
  // vẫn ra điểm của 5 cái mới nhất, sai lệch thấy rõ.
  const reviewCount = reviewStats?.total ?? 0;
  const reviewAvg = reviewStats?.average.overall ?? null;

  const images = hotel?.images ?? [];
  const amenities = Array.from(
    new Set(rooms.flatMap((rt) => rt.amenities.map((a) => a.amenity.name))),
  ).slice(0, 8);

  function openRoom(roomTypeId: string) {
    router.push({
      pathname: '/room/[id]',
      params: { id: roomTypeId, hotelId: id, checkIn, checkOut, guests: String(guests) },
    });
  }

  function handleCarouselScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== imageIndex) setImageIndex(next);
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-canvas items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
      </View>
    );
  }

  if (!hotel) {
    return (
      <View className="flex-1 bg-canvas items-center justify-center gap-3 px-8" style={{ paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <Ionicons name="alert-circle-outline" size={48} color={GUEST_COLORS.hairline} />
        <Text className="font-bevi text-muted text-center">{t('hotel:notFound')}</Text>
        <Pressable onPress={() => router.back()} className="bg-on-surface rounded-field px-5 py-2.5">
          <Text bold className="font-bevi-bold text-white">{t('hotel:goBack')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* ── Image Carousel ── */}
        <View style={{ height: CAROUSEL_H }}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(img) => img.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleCarouselScroll}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.url }}
                  style={{ width: SCREEN_W, height: CAROUSEL_H }}
                  contentFit="cover"
                  transition={200}
                />
              )}
            />
          ) : (
            <View className="items-center justify-center bg-gray-300" style={{ width: SCREEN_W, height: CAROUSEL_H }}>
              <Ionicons name="image-outline" size={52} color="rgba(0,0,0,0.2)" />
            </View>
          )}

          {/* Top bar overlay */}
          <View className="absolute left-0 right-0 flex-row items-center justify-between px-4" style={{ top: insets.top + 6 }}>
            <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-black/30 items-center justify-center">
              <Ionicons name="arrow-back" size={20} color={GUEST_COLORS.white} />
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => hotel && router.push({ pathname: '/(tabs)/chatbot', params: { hotelId: hotel.id, hotelName: hotel.name } })}
                className="w-9 h-9 rounded-full bg-black/30 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel={t('hotel:chatWithHotel')}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={GUEST_COLORS.white} />
              </Pressable>
              <Pressable className="w-9 h-9 rounded-full bg-black/30 items-center justify-center">
                <Ionicons name="share-outline" size={18} color={GUEST_COLORS.white} />
              </Pressable>
              <Pressable onPress={() => setSaved((v) => !v)} className="w-9 h-9 rounded-full bg-black/30 items-center justify-center">
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? '#EF4444' : GUEST_COLORS.white} />
              </Pressable>
            </View>
          </View>

          {/* Counter + dots */}
          {images.length > 1 && (
            <>
              <View className="absolute bottom-3.5 right-3.5 bg-black/50 rounded-full px-2.5 py-1">
                <Text size="xs" bold className="font-bevi-bold text-white">{imageIndex + 1}/{images.length}</Text>
              </View>
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5">
                {images.map((img, i) => (
                  <View key={img.id} className={`h-1.5 rounded-full ${i === imageIndex ? 'w-5 bg-surface' : 'w-1.5 bg-surface/50'}`} />
                ))}
              </View>
            </>
          )}
        </View>

        <View className="p-4">
          {/* ── Hotel Info ── */}
          <View className="bg-surface rounded-card p-4 mb-3.5">
            {hotel.starRating ? (
              <View className="flex-row items-center gap-1.5">
                <StarRating count={hotel.starRating} size={13} />
                <Text size="xs" className="font-bevi text-on-surface-variant">{hotel.starRating}-star Hotel</Text>
              </View>
            ) : null}
            <Heading size="xl" className="font-bevi-bold text-on-surface mt-1.5 mb-2">{hotel.name}</Heading>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1 flex-1 pr-2">
                <Ionicons name="location-outline" size={14} color={GUEST_COLORS.onSurfaceVariant} />
                <Text size="sm" className="font-bevi text-on-surface-variant flex-1" numberOfLines={1}>{hotel.address}, {getHotelLocation(hotel)}</Text>
              </View>
              {reviewAvg !== null && (
                <View className="bg-blue-100 rounded-lg px-2.5 py-1">
                  <Text size="sm" bold className="font-bevi-bold text-blue-700">{reviewAvg.toFixed(1)} ★</Text>
                </View>
              )}
            </View>

            <Text size="xs" className="font-bevi text-muted mt-1">{reviewCount} reviews</Text>

            {/* Amenities */}
            {amenities.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                <View className="flex-row gap-2">
                  {amenities.map((a) => (
                    <View key={a} className="flex-row items-center gap-1.5 border border-hairline/50 rounded-full px-2 py-1.5">
                      <Ionicons name="checkmark-circle-outline" size={13} color={GUEST_COLORS.bronze} />
                      <Text size="xs" className="font-bevi-medium text-on-surface font-medium">{a}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* ── Your stay (date/guest picker) ── */}
          <Pressable onPress={() => setPickerOpen(true)} className="bg-surface rounded-card p-4 mb-3.5 flex-row items-center">
            <View className="flex-1 flex-row items-center gap-4">
              <View>
                <Text size="2xs" className="font-bevi text-muted uppercase">{t('hotel:checkIn')}</Text>
                <Text bold className="font-bevi-bold text-on-surface text-sm">{formatDateShort(checkIn)}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={GUEST_COLORS.muted} />
              <View>
                <Text size="2xs" className="font-bevi text-muted uppercase">{t('hotel:checkOut')}</Text>
                <Text bold className="font-bevi-bold text-on-surface text-sm">{formatDateShort(checkOut)}</Text>
              </View>
              <View className="border-l border-hairline/30 pl-4">
                <Text size="2xs" className="font-bevi text-muted uppercase">{t('hotel:guests')}</Text>
                <Text bold className="font-bevi-bold text-on-surface text-sm">{guests}</Text>
              </View>
            </View>
            <View className="w-9 h-9 rounded-full bg-brand/10 items-center justify-center">
              <Ionicons name="create-outline" size={18} color={GUEST_COLORS.onSurface} />
            </View>
          </Pressable>

          {/* ── Select Room ── */}
          <Heading size="lg" className="font-bevi-bold text-on-surface mb-3">{t('hotel:selectRoom')}</Heading>
          {rooms.length === 0 ? (
            <View className="bg-surface rounded-card p-6 items-center mb-3">
              <Text size="sm" className="font-bevi text-muted">{t('hotel:noRooms')}</Text>
            </View>
          ) : (
            rooms.map((r) => <RoomTypeCard key={r.id} room={r} onPress={() => openRoom(r.id)} />)
          )}

          {/* ── Guest Reviews ── */}
          <View className="mt-2">
            <HotelReviews hotelId={id} />
          </View>

          {/* ── Location ── */}
          <Heading size="lg" className="font-bevi-bold text-on-surface mb-3">{t('hotel:location')}</Heading>
          <HotelMap
            latitude={mapLat}
            longitude={mapLng}
            name={hotel.name}
            address={fullAddress}
          />
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
