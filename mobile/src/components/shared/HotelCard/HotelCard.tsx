import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import type { HotelSearchResult } from '@/types/hotels.type';
import { getPrimaryImageUrl, getHotelLocation } from '@/utils/hotel';
import { formatVnd } from '@/utils/formatCurrency';

interface HotelCardProps {
  hotel: HotelSearchResult;
  onPress: () => void;
}

export function HotelCard({ hotel, onPress }: HotelCardProps) {
  const imageUrl = getPrimaryImageUrl(hotel.images);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row bg-white rounded-2xl mb-3 overflow-hidden shadow-hard-5"
    >
      {/* Thumbnail */}
      <View className="w-24 h-[110px] bg-gray-200 overflow-hidden">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="bed-outline" size={32} color="rgba(0,0,0,0.2)" />
          </View>
        )}
        {hotel.starRating ? (
          <View className="absolute top-2 left-2 bg-gold rounded px-1.5 py-0.5 flex-row items-center gap-0.5">
            <Ionicons name="star" size={9} color="#0B1D45" />
            <Text size="2xs" bold className="text-navy">{hotel.starRating}</Text>
          </View>
        ) : null}
      </View>

      {/* Info */}
      <View className="flex-1 p-3 justify-between">
        <View>
          <Text bold className="text-navy text-sm" numberOfLines={1}>{hotel.name}</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text size="xs" className="text-gray-500 flex-1" numberOfLines={1}>{getHotelLocation(hotel)}</Text>
          </View>
        </View>
        <View>
          {hotel.minPrice ? (
            <>
              <Text size="2xs" className="text-gray-400">from</Text>
              <Text bold className="text-navy text-[15px]">{formatVnd(hotel.minPrice)}</Text>
              <Text size="2xs" className="text-gray-400">per night</Text>
            </>
          ) : (
            <Text size="xs" className="text-gray-400">Contact for price</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
