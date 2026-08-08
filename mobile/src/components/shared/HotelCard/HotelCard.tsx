import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import type { HotelSearchResult } from '@/types/hotels.type';
import { getPrimaryImageUrl, getHotelLocation } from '@/utils/hotel';
import { formatVnd } from '@/utils/formatCurrency';
import { GUEST_COLORS } from '@/constants/guestTheme';

interface HotelCardProps {
  hotel: HotelSearchResult;
  onPress: () => void;
}

/**
 * Thẻ khách sạn — theo công thức card của client: `rounded-2xl` + viền tóc
 * `outline-variant/30` + nền `surface`, dựng khối bằng viền chứ không đổ bóng đậm.
 */
export function HotelCard({ hotel, onPress }: HotelCardProps) {
  const { t } = useTranslation(['common', 'hotel']);
  const imageUrl = getPrimaryImageUrl(hotel.images);

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-card border border-hairline/30 bg-surface"
    >
      <View className="h-[118px] w-24 overflow-hidden bg-surface-container">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="bed-outline" size={30} color={GUEST_COLORS.hairline} />
          </View>
        )}
        {hotel.starRating ? (
          <View className="absolute left-2 top-2 flex-row items-center gap-0.5 rounded-full bg-on-surface/85 px-2 py-0.5">
            <Ionicons name="star" size={9} color={GUEST_COLORS.premiumGold} />
            <Text className="font-bevi-bold text-white" size="2xs">
              {hotel.starRating}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-1 justify-between p-3.5">
        <View>
          <Text className="font-bevi-semibold text-on-surface" size="sm" numberOfLines={1}>
            {hotel.name}
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="location-outline" size={12} color={GUEST_COLORS.muted} />
            <Text className="flex-1 font-bevi text-on-surface-variant" size="xs" numberOfLines={1}>
              {getHotelLocation(hotel)}
            </Text>
          </View>
        </View>
        <View>
          {hotel.minPrice ? (
            <View className="flex-row items-baseline gap-1">
              <Text className="font-bevi text-muted" size="2xs">
                {t('from')}
              </Text>
              <Text className="font-bevi-bold text-on-surface" size="md">
                {formatVnd(hotel.minPrice)}
              </Text>
              <Text className="font-bevi text-on-surface-variant" size="2xs">
                {t('hotel:room.perNight')}
              </Text>
            </View>
          ) : (
            <Text className="font-bevi text-muted" size="xs">
              {t('contactForPrice')}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
