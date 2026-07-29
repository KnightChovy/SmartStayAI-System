import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useGetHotels } from '@/hooks/hotels';
import { getInitials } from '@/utils/hotel';
import type { HotelSearchResult } from '@/types/hotels.type';
import { GUEST_COLORS } from '@/constants/guestTheme';

function coverUrl(hotel: HotelSearchResult): string | null {
  return hotel.images.find((i) => i.isPrimary)?.url ?? hotel.images[0]?.url ?? null;
}

export default function NewMessageScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const { data, isLoading } = useGetHotels({ limit: 100 });
  const [query, setQuery] = useState('');

  const hotels = useMemo(() => {
    const list = data?.results ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((h) => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q));
  }, [data, query]);

  function pick(hotel: HotelSearchResult) {
    // replace: quay lại từ thread sẽ về danh sách, không kẹt ở màn chọn.
    router.replace({ pathname: '/profile/messages/[hotelId]', params: { hotelId: hotel.id, name: hotel.name } });
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">{t('account:messages.pickHotel')}</Heading>
      </View>

      <View className="px-4 pt-3">
        <View className="flex-row items-center gap-2 bg-surface-low border border-hairline/40 rounded-field px-3 h-11">
          <Ionicons name="search" size={18} color={GUEST_COLORS.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('account:messages.searchHotel')}
            placeholderTextColor={GUEST_COLORS.muted}
            autoCapitalize="none"
            className="flex-1 text-on-surface text-sm font-bevi"
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={GUEST_COLORS.onSurface} />
        </View>
      ) : hotels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-bevi text-muted text-center">{t('account:messages.noHotels')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {hotels.map((hotel) => {
            const url = coverUrl(hotel);
            return (
              <Pressable key={hotel.id} onPress={() => pick(hotel)} className="flex-row items-center gap-3 bg-surface rounded-card p-3 mb-2">
                {url ? (
                  <Image source={{ uri: url }} style={{ width: 52, height: 52, borderRadius: 14 }} contentFit="cover" />
                ) : (
                  <View className="w-[52px] h-[52px] rounded-[14px] bg-bronze items-center justify-center">
                    <Text bold className="font-bevi-bold text-on-surface">{getInitials(hotel.name)}</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text bold numberOfLines={1} className="font-bevi-bold text-on-surface">{hotel.name}</Text>
                  <Text size="sm" numberOfLines={1} className="font-bevi text-muted mt-0.5">{hotel.city}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={GUEST_COLORS.muted} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
