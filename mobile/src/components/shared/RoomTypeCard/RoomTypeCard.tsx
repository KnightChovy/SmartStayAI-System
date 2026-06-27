import { View, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { getPrimaryImageUrl } from '@/utils/hotel';
import { formatVnd } from '@/utils/formatCurrency';
import type { RoomType } from '@/types/hotels.type';

const GOLD = '#F5A623';
const ROOM_IMG_H = 150;
// Bề rộng ảnh = màn hình - padding ngoài (p-4 = 16*2) - viền card (border-2 = 2*2).
const ROOM_IMG_W = Dimensions.get('window').width - 36;

/** Gộp thông số phòng: "32m² • King bed • Sea view". */
export function roomMeta(room: Pick<RoomType, 'areaSqm' | 'bedType' | 'viewType'>): string {
  return [room.areaSqm ? `${room.areaSqm}m²` : null, room.bedType, room.viewType]
    .filter(Boolean)
    .join(' • ');
}

export interface RoomTypeCardProps {
  room: RoomType;
  /** Viền vàng khi đang được chọn. */
  selected?: boolean;
  onPress: () => void;
}

/** Thẻ một loại phòng — ảnh, thông số, giá; bấm để mở chi tiết phòng. */
export function RoomTypeCard({ room, selected = false, onPress }: RoomTypeCardProps) {
  const roomImg = getPrimaryImageUrl(room.images);
  const meta = roomMeta(room);
  const lowStock =
    typeof room.availableRooms === 'number' && room.availableRooms > 0 && room.availableRooms <= 3;
  const soldOut = room.availableRooms === 0;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl mb-3 overflow-hidden border-2 shadow-hard-5"
      style={{ borderColor: selected ? GOLD : 'transparent' }}
    >
      <View className="bg-gray-200 items-center justify-center overflow-hidden" style={{ height: ROOM_IMG_H }}>
        {roomImg ? (
          <Image source={{ uri: roomImg }} style={{ width: ROOM_IMG_W, height: ROOM_IMG_H }} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name="bed-outline" size={44} color="rgba(0,0,0,0.15)" />
        )}
        {lowStock && (
          <View className="absolute top-2.5 left-2.5 bg-red-500 rounded-md px-2 py-0.5">
            <Text size="2xs" bold className="text-white">ONLY {room.availableRooms} LEFT!</Text>
          </View>
        )}
        {soldOut && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <Text bold className="text-white">Sold out</Text>
          </View>
        )}
      </View>

      <View className="p-3.5">
        <Text bold className="text-navy text-[15px] mb-1">{room.name}</Text>
        <Text size="xs" className="text-gray-500 mb-2.5">{meta || `Up to ${room.maxOccupancy} guests`}</Text>
        <View className="flex-row items-center justify-between">
          <View>
            <Text bold className="text-navy text-lg">{formatVnd(room.basePrice)}</Text>
            <Text size="2xs" className="text-gray-400">/ night</Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-navy rounded-xl px-4 py-2.5">
            <Text size="sm" bold className="text-white">View details</Text>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
