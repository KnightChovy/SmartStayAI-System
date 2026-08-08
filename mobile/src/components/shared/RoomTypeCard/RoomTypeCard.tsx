import { View, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { getPrimaryImageUrl } from '@/utils/hotel';
import { formatVnd } from '@/utils/formatCurrency';
import type { RoomType } from '@/types/hotels.type';
import { GUEST_COLORS } from '@/constants/guestTheme';

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
  const { t } = useTranslation(['hotel', 'common']);
  const roomImg = getPrimaryImageUrl(room.images);
  const meta = roomMeta(room);
  const lowStock =
    typeof room.availableRooms === 'number' && room.availableRooms > 0 && room.availableRooms <= 3;
  const soldOut = room.availableRooms === 0;
  // Khi có khoảng ngày, BE trả `totalPrice` (đã áp pricing rule + thuế/phí) = ĐÚNG số khách trả.
  // Hiện số này thay cho basePrice để thẻ ngoài khớp với tổng ở màn chi tiết (không còn "ngoài 2tr6,
  // vào 2tr436"). Không có ngày ⇒ chưa biết giá theo đêm ⇒ hiện basePrice "từ ... / đêm".
  const hasQuote = room.totalPrice !== undefined;
  const taxFeeTotal =
    room.taxAmount != null && room.feeAmount != null
      ? Number(room.taxAmount) + Number(room.feeAmount)
      : null;
  const nights = room.numNights ?? 0;

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-card mb-3 overflow-hidden border-2"
      style={{ borderColor: selected ? GUEST_COLORS.bronze : 'transparent' }}
    >
      <View className="bg-surface-container items-center justify-center overflow-hidden" style={{ height: ROOM_IMG_H }}>
        {roomImg ? (
          <Image source={{ uri: roomImg }} style={{ width: ROOM_IMG_W, height: ROOM_IMG_H }} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name="bed-outline" size={44} color="rgba(0,0,0,0.15)" />
        )}
        {lowStock && (
          <View className="absolute top-2.5 left-2.5 bg-red-500 rounded-md px-2 py-0.5">
            <Text size="2xs" bold className="font-bevi-bold text-white uppercase">
              {t('hotel:room.onlyLeft', { count: room.availableRooms })}
            </Text>
          </View>
        )}
        {soldOut && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <Text bold className="font-bevi-bold text-white">{t('hotel:room.soldOut')}</Text>
          </View>
        )}
      </View>

      <View className="p-3.5">
        <Text bold className="font-bevi-bold text-on-surface text-[15px] mb-1">{room.name}</Text>
        <Text size="xs" className="font-bevi text-on-surface-variant mb-2.5">
          {meta || t('hotel:room.upToGuests', { count: room.maxOccupancy })}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            {hasQuote ? (
              <>
                <Text size="2xs" className="font-bevi text-muted">{t('hotel:room.nightsTotal', { count: nights })}</Text>
                <Text bold className="font-bevi-bold text-on-surface text-lg">{formatVnd(room.totalPrice!)}</Text>
                {taxFeeTotal != null && taxFeeTotal > 0 && (
                  <Text size="2xs" className="font-bevi text-muted">
                    {t('hotel:room.inclTaxesFees', { amount: formatVnd(taxFeeTotal) })}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text bold className="font-bevi-bold text-on-surface text-lg">{formatVnd(room.basePrice)}</Text>
                <Text size="2xs" className="font-bevi text-muted">{t('hotel:room.perNight')}</Text>
              </>
            )}
          </View>
          <View className="flex-row items-center gap-1.5 bg-on-surface rounded-field px-4 py-2.5">
            <Text size="sm" bold className="font-bevi-bold text-white">{t('hotel:room.viewDetails')}</Text>
            <Ionicons name="chevron-forward" size={14} color={GUEST_COLORS.white} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
