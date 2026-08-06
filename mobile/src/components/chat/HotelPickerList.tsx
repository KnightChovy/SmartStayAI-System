import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { useGetHotels } from '@/hooks/hotels';
import { getInitials } from '@/utils/hotel';
import type { HotelSearchResult } from '@/types/hotels.type';
import { GUEST_COLORS } from '@/constants/guestTheme';

function coverUrl(hotel: HotelSearchResult): string | null {
  return hotel.images.find((i) => i.isPrimary)?.url ?? hotel.images[0]?.url ?? null;
}

export interface HotelPickerListProps {
  onSelect: (hotel: HotelSearchResult) => void;
}

/** Tìm + chọn khách sạn — dùng chung cho `profile/messages/new.tsx` và bộ chuyển scope
 *  ở tab Chat (mở hội thoại kiểu "Khách sạn này" cần biết đang nói chuyện với KS nào). */
export function HotelPickerList({ onSelect }: HotelPickerListProps) {
  const { t } = useTranslation(['account', 'common']);
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useGetHotels({ limit: 100 });
  const [query, setQuery] = useState('');

  const hotels = useMemo(() => {
    const list = data?.results ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((h) => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <View className="flex-1">
      <View className="px-4 pt-3">
        <View className="flex-row items-center gap-2 bg-surface-low border border-hairline/40 rounded-field px-3 h-11">
          <Ionicons name="search" size={18} color={GUEST_COLORS.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('messages.searchHotel')}
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
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={40} color={GUEST_COLORS.muted} />
          <Text className="mt-3 text-center font-bevi text-muted">
            {t('messages.hotelLoadError')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-4 rounded-card bg-on-surface px-5 py-2.5"
            accessibilityRole="button"
            accessibilityLabel={t('common:retry')}
          >
            <Text bold className="font-bevi-bold text-white">
              {t('common:retry')}
            </Text>
          </Pressable>
        </View>
      ) : hotels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-bevi text-muted text-center">{t('messages.noHotels')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: Math.max(insets.bottom, 12) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {hotels.map((hotel) => {
            const url = coverUrl(hotel);
            return (
              <Pressable key={hotel.id} onPress={() => onSelect(hotel)} className="flex-row items-center gap-3 bg-surface rounded-card p-3 mb-2">
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
    </View>
  );
}
