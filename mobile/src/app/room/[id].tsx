import { useMemo, useState } from 'react';
import {
  View, ScrollView, Pressable, FlatList, ActivityIndicator, Dimensions,
  type NativeSyntheticEvent, type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { PriceSummary } from '@/components/shared/PriceSummary';
import { StayPickerSheet } from '@/components/shared/StayPickerSheet';
import { useGetHotel, useGetRoomTypes } from '@/hooks/hotels';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateShort, nightsBetween, todayKey, toDateKey, addDays } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const CAROUSEL_H = 260;

type RoomMetaIcon = { icon: React.ComponentProps<typeof Ionicons>['name']; label: string };

export default function RoomDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation(['hotel', 'common']);
  const params = useLocalSearchParams<{
    id: string; hotelId: string; checkIn?: string; checkOut?: string; guests?: string;
  }>();
  const insets = useSafeAreaInsets();

  const [checkIn, setCheckIn] = useState(params.checkIn ?? todayKey());
  const [checkOut, setCheckOut] = useState(params.checkOut ?? toDateKey(addDays(todayKey(), 1)));
  const [guests, setGuests] = useState(params.guests ? Number(params.guests) : 2);
  const [imageIndex, setImageIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: hotel } = useGetHotel(params.hotelId);
  const { data: roomTypes, isLoading } = useGetRoomTypes(params.hotelId, { checkIn, checkOut, guests });

  const room = useMemo(
    () => (roomTypes ?? []).find((r) => r.id === params.id),
    [roomTypes, params.id],
  );

  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = useMemo(() => {
    if (!room) return 0;
    if (room.totalPrice) return Number(room.totalPrice);
    return Number(room.basePrice) * nights;
  }, [room, nights]);

  const images = room?.images ?? [];
  const metaItems: RoomMetaIcon[] = room
    ? [
        room.areaSqm ? { icon: 'expand-outline', label: `${room.areaSqm} m²` } : null,
        room.bedType ? { icon: 'bed-outline', label: room.bedType } : null,
        room.viewType ? { icon: 'eye-outline', label: room.viewType } : null,
        { icon: 'people-outline', label: `Up to ${room.maxOccupancy} guests` },
      ].filter(Boolean) as RoomMetaIcon[]
    : [];

  function handleCarouselScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== imageIndex) setImageIndex(next);
  }

  function handleBookNow() {
    if (!room) return;
    router.push({
      pathname: '/booking/checkout',
      params: {
        hotelId: params.hotelId,
        roomTypeId: room.id,
        roomName: room.name,
        hotelName: hotel?.name ?? '',
        checkIn,
        checkOut,
        guests: String(guests),
        basePrice: room.basePrice,
        totalPrice: room.totalPrice ?? '',
      },
    });
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-canvas items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
      </View>
    );
  }

  if (!room) {
    return (
      <View className="flex-1 bg-canvas items-center justify-center gap-3 px-8" style={{ paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <Ionicons name="bed-outline" size={48} color={GUEST_COLORS.hairline} />
        <Text className="font-bevi text-muted text-center">{t('hotel:room.unavailable')}</Text>
        <Pressable onPress={() => router.back()} className="bg-on-surface rounded-field px-5 py-2.5">
          <Text bold className="font-bevi-bold text-white">{t('hotel:goBack')}</Text>
        </Pressable>
      </View>
    );
  }

  const soldOut = room.availableRooms === 0;

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}>
        {/* ── Carousel ── */}
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
                <Image source={{ uri: item.url }} style={{ width: SCREEN_W, height: CAROUSEL_H }} contentFit="cover" transition={200} />
              )}
            />
          ) : (
            <View className="items-center justify-center bg-gray-300" style={{ width: SCREEN_W, height: CAROUSEL_H }}>
              <Ionicons name="bed-outline" size={52} color="rgba(0,0,0,0.2)" />
            </View>
          )}

          <View className="absolute left-0 right-0 flex-row items-center justify-between px-4" style={{ top: insets.top + 6 }}>
            <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-black/30 items-center justify-center">
              <Ionicons name="arrow-back" size={20} color={GUEST_COLORS.white} />
            </Pressable>
          </View>

          {images.length > 1 && (
            <View className="absolute bottom-3.5 right-3.5 bg-black/50 rounded-full px-2.5 py-1">
              <Text size="xs" bold className="font-bevi-bold text-white">{imageIndex + 1}/{images.length}</Text>
            </View>
          )}
        </View>

        <View className="p-4">
          {/* ── Room header ── */}
          <View className="bg-surface rounded-card p-4 mb-3.5">
            {hotel?.name ? <Text size="xs" className="font-bevi text-muted mb-1">{hotel.name}</Text> : null}
            <Heading size="xl" className="font-bevi-bold text-on-surface mb-3">{room.name}</Heading>
            <View className="flex-row flex-wrap gap-2">
              {metaItems.map((m) => (
                <View key={m.label} className="flex-row items-center gap-1.5 bg-surface-low rounded-full px-3 py-1.5">
                  <Ionicons name={m.icon} size={14} color={GUEST_COLORS.onSurface} />
                  <Text size="xs" className="font-bevi-medium text-on-surface font-medium">{m.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Your stay (date/guest picker) ── */}
          <Heading size="lg" className="font-bevi-bold text-on-surface mb-3">{t('hotel:room.yourStay')}</Heading>
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

          {typeof room.availableRooms === 'number' && (
            <View className="flex-row items-center gap-1.5 mb-3.5 px-1">
              <Ionicons name={soldOut ? 'close-circle' : 'checkmark-circle'} size={15} color={soldOut ? '#DC2626' : '#16A34A'} />
              <Text size="sm" className={`font-bevi ${soldOut ? 'text-red-600' : 'text-green-700'}`}>
                {soldOut ? 'No rooms left for these dates' : `${room.availableRooms} room${room.availableRooms > 1 ? 's' : ''} available`}
              </Text>
            </View>
          )}

          {/* ── Description ── */}
          {room.description ? (
            <>
              <Heading size="lg" className="font-bevi-bold text-on-surface mb-2">{t('hotel:room.about')}</Heading>
              <View className="bg-surface rounded-card p-4 mb-3.5">
                <Text size="sm" className="font-bevi text-on-surface-variant leading-6">{room.description}</Text>
              </View>
            </>
          ) : null}

          {/* ── Amenities ── */}
          {room.amenities.length > 0 && (
            <>
              <Heading size="lg" className="font-bevi-bold text-on-surface mb-2">{t('hotel:room.amenities')}</Heading>
              <View className="bg-surface rounded-card p-4 mb-3.5">
                {room.amenities.map(({ amenity }) => (
                  <View key={amenity.id} className="flex-row items-center gap-2.5 py-1.5">
                    <Ionicons name="checkmark-circle-outline" size={18} color={GUEST_COLORS.bronze} />
                    <Text size="sm" className="font-bevi text-on-surface-variant">{amenity.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Price breakdown ── */}
          <Heading size="lg" className="font-bevi-bold text-on-surface mb-2">{t('hotel:room.priceDetails')}</Heading>
          <View className="bg-surface rounded-card p-4 mb-2">
            <PriceSummary
              lines={[{ label: `${formatVnd(room.basePrice)} × ${nights} night${nights > 1 ? 's' : ''}`, value: subtotal }]}
              total={subtotal}
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky bottom ── */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-surface border-t border-hairline/30 flex-row items-center justify-between px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View>
          <Text bold className="font-bevi-bold text-on-surface text-xl">{formatVnd(subtotal)}</Text>
          <Text size="2xs" className="font-bevi text-muted">for {nights} night{nights > 1 ? 's' : ''} (incl. taxes)</Text>
        </View>
        <Pressable
          disabled={soldOut}
          onPress={handleBookNow}
          className="rounded-card px-7 py-3.5"
          style={{ backgroundColor: soldOut ? GUEST_COLORS.hairline : GUEST_COLORS.bronze }}
        >
          <Text bold className={`font-bevi-bold ${soldOut ? 'text-muted text-[15px]' : 'text-on-surface text-[15px]'}`}>
            {soldOut ? 'Sold out' : 'Book now'}
          </Text>
        </Pressable>
      </View>

      <StayPickerSheet
        visible={pickerOpen}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialGuests={guests}
        maxGuests={room.maxOccupancy}
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
