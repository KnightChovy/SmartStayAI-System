import { useState } from 'react';
import { View, ScrollView, Pressable, FlatList, ActivityIndicator, Dimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { StarRating } from '@/components/shared/StarRating';
import { useGetHotel, useGetRoomTypes } from '@/hooks/hotels';
import { useGetReviews } from '@/hooks/reviews';
import { getPrimaryImageUrl, getHotelLocation, getInitials } from '@/utils/hotel';
import { formatVnd } from '@/utils/formatCurrency';

const { width: SCREEN_W } = Dimensions.get('window');
const CAROUSEL_H = 280;
const ROOM_IMG_H = 150;
// Bề rộng ảnh phòng = màn hình - padding ngoài (p-4 = 16*2) - viền card (border-2 = 2*2).
const ROOM_IMG_W = SCREEN_W - 36;
const GOLD = '#F5A623';

const AVATAR_COLORS = ['#0D9488', '#B45309', '#1D4ED8', '#7C3AED', '#DC2626', '#059669'];
function avatarColor(seed: string): string {
  let sum = 0;
  for (const ch of seed) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function roomDetails(room: { areaSqm?: string | null; bedType?: string | null; viewType?: string | null }): string {
  return [room.areaSqm ? `${room.areaSqm}m²` : null, room.bedType, room.viewType].filter(Boolean).join(' • ');
}

export default function HotelDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [imageIndex, setImageIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const { data: hotel, isLoading } = useGetHotel(id);
  const { data: roomTypes } = useGetRoomTypes(id);
  const { data: reviewsData } = useGetReviews({ hotelId: id, limit: 5 });

  const rooms = roomTypes ?? [];
  const reviews = reviewsData?.results ?? [];
  const reviewCount = reviewsData?.totalResults ?? reviews.length;
  const reviewAvg = reviews.length
    ? reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length
    : null;

  const images = hotel?.images ?? [];
  const amenities = Array.from(
    new Set(rooms.flatMap((rt) => rt.amenities.map((a) => a.amenity.name))),
  ).slice(0, 8);

  const selected = rooms.find((r) => r.id === selectedRoom) ?? rooms[0];
  const displayPrice = selected?.basePrice ?? hotel?.minPrice ?? null;

  function handleCarouselScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== imageIndex) setImageIndex(next);
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#0B1D45" />
      </View>
    );
  }

  if (!hotel) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center gap-3 px-8" style={{ paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text className="text-gray-400 text-center">Hotel not found.</Text>
        <Pressable onPress={() => router.back()} className="bg-navy rounded-xl px-5 py-2.5">
          <Text bold className="text-white">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 56 + insets.bottom }}>
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

          {/* Top bar overlay (theo safe-area) */}
          <View className="absolute left-0 right-0 flex-row items-center justify-between px-4" style={{ top: insets.top + 6 }}>
            <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-black/30 items-center justify-center">
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable className="w-9 h-9 rounded-full bg-black/30 items-center justify-center">
                <Ionicons name="share-outline" size={18} color="#fff" />
              </Pressable>
              <Pressable onPress={() => setSaved((v) => !v)} className="w-9 h-9 rounded-full bg-black/30 items-center justify-center">
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? '#EF4444' : '#fff'} />
              </Pressable>
            </View>
          </View>

          {/* Counter + dots */}
          {images.length > 1 && (
            <>
              <View className="absolute bottom-3.5 right-3.5 bg-black/50 rounded-full px-2.5 py-1">
                <Text size="xs" bold className="text-white">{imageIndex + 1}/{images.length}</Text>
              </View>
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5">
                {images.map((img, i) => (
                  <View key={img.id} className={`h-1.5 rounded-full ${i === imageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
                ))}
              </View>
            </>
          )}
        </View>

        <View className="p-4">
          {/* ── Hotel Info ── */}
          <View className="bg-white rounded-2xl p-4 mb-3.5">
            {hotel.starRating ? (
              <View className="flex-row items-center gap-1.5">
                <StarRating count={hotel.starRating} size={13} />
                <Text size="xs" className="text-gray-500">{hotel.starRating}-star Hotel</Text>
              </View>
            ) : null}
            <Heading size="xl" className="text-navy mt-1.5 mb-2">{hotel.name}</Heading>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1 flex-1 pr-2">
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text size="sm" className="text-gray-500 flex-1" numberOfLines={1}>{hotel.address}, {getHotelLocation(hotel)}</Text>
              </View>
              {reviewAvg !== null && (
                <View className="bg-blue-100 rounded-lg px-2.5 py-1">
                  <Text size="sm" bold className="text-blue-700">{reviewAvg.toFixed(1)} ★</Text>
                </View>
              )}
            </View>

            <Text size="xs" className="text-gray-400 mt-1">{reviewCount} reviews</Text>

            {/* Amenities */}
            {amenities.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                <View className="flex-row gap-2">
                  {amenities.map((a) => (
                    <View key={a} className="flex-row items-center gap-1.5 border border-gray-200 rounded-full px-2 py-1.5">
                      <Ionicons name="checkmark-circle-outline" size={13} color={GOLD} />
                      <Text size="xs" className="text-navy font-medium">{a}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* ── Select Room ── */}
          <Heading size="lg" className="text-navy mb-3">Select Room</Heading>
          {rooms.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center mb-3">
              <Text size="sm" className="text-gray-400">No rooms available</Text>
            </View>
          ) : (
            rooms.map((r) => {
              const roomImg = getPrimaryImageUrl(r.images);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setSelectedRoom(r.id)}
                  className="bg-white rounded-2xl mb-3 overflow-hidden border-2 shadow-hard-5"
                  style={{ borderColor: selectedRoom === r.id ? GOLD : 'transparent' }}
                >
                  {/* Room image */}
                  <View className="bg-gray-200 items-center justify-center overflow-hidden" style={{ height: ROOM_IMG_H }}>
                    {roomImg ? (
                      <Image source={{ uri: roomImg }} style={{ width: ROOM_IMG_W, height: ROOM_IMG_H }} contentFit="cover" transition={200} />
                    ) : (
                      <Ionicons name="bed-outline" size={44} color="rgba(0,0,0,0.15)" />
                    )}
                    {typeof r.availableRooms === 'number' && r.availableRooms > 0 && r.availableRooms <= 3 && (
                      <View className="absolute top-2.5 left-2.5 bg-red-500 rounded-md px-2 py-0.5">
                        <Text size="2xs" bold className="text-white">ONLY {r.availableRooms} LEFT!</Text>
                      </View>
                    )}
                  </View>

                  {/* Room details */}
                  <View className="p-3.5">
                    <Text bold className="text-navy text-[15px] mb-1">{r.name}</Text>
                    <Text size="xs" className="text-gray-500 mb-2.5">{roomDetails(r) || `Up to ${r.maxOccupancy} guests`}</Text>
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text bold className="text-navy text-lg">{formatVnd(r.basePrice)}</Text>
                        <Text size="2xs" className="text-gray-400">/ night</Text>
                      </View>
                      <Pressable onPress={() => setSelectedRoom(r.id)} className="bg-navy rounded-xl px-5 py-2.5">
                        <Text size="sm" bold className="text-white">Select</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}

          {/* ── Guest Reviews ── */}
          {reviews.length > 0 && (
            <>
              <View className="flex-row items-center justify-between mt-2 mb-3">
                <Heading size="lg" className="text-navy">Guest Reviews</Heading>
                <Pressable>
                  <Text size="sm" bold className="text-gold">View all →</Text>
                </Pressable>
              </View>

              {reviews.map((review) => {
                const name = review.customer?.fullName ?? 'Guest';
                return (
                  <View key={review.id} className="bg-white rounded-2xl p-3.5 mb-3">
                    <View className="flex-row items-center justify-between mb-2.5">
                      <View className="flex-row items-center gap-2.5">
                        <View className="w-[38px] h-[38px] rounded-full items-center justify-center" style={{ backgroundColor: avatarColor(name) }}>
                          <Text size="sm" bold className="text-white">{getInitials(name)}</Text>
                        </View>
                        <View>
                          <Text bold className="text-navy text-sm">{name}</Text>
                          <Text size="xs" className="text-gray-400">{review.createdAt.slice(0, 10)}</Text>
                        </View>
                      </View>
                      <View className="bg-navy rounded-lg px-2 py-1">
                        <Text size="sm" bold className="text-white">{review.overallRating}</Text>
                      </View>
                    </View>
                    {review.title ? <Text bold className="text-navy text-sm mb-1">{review.title}</Text> : null}
                    <Text size="sm" className="text-gray-700 leading-5">{review.content}</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* ── Location ── */}
          <Heading size="lg" className="text-navy mb-3">Location</Heading>
          <View className="bg-white rounded-2xl overflow-hidden mb-4">
            <View className="h-[140px] bg-blue-200 items-center justify-center">
              <Ionicons name="map" size={48} color="#3B82F6" />
            </View>
            <View className="p-3.5 flex-row items-center gap-2">
              <Ionicons name="location" size={16} color={GOLD} />
              <Text size="sm" className="text-gray-700 font-medium flex-1">{hotel.address}, {getHotelLocation(hotel)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex-row items-center justify-between px-5 pt-3 pb-6">
        <View>
          <Text bold className="text-navy text-xl">{displayPrice ? formatVnd(displayPrice) : '—'}</Text>
          <Text size="2xs" className="text-gray-400">Price for 1 night (incl. taxes)</Text>
        </View>
        <Pressable className="bg-gold rounded-2xl px-4 py-3.5">
          <Text bold className="text-navy text-[15px]">Book now</Text>
        </Pressable>
      </View>
    </View>
  );
}
