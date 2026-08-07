import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Heading } from '@/components/ui/heading';
import { HotelPickerList } from '@/components/chat';
import type { HotelSearchResult } from '@/types/hotels.type';
import { GUEST_COLORS } from '@/constants/guestTheme';

export default function NewMessageScreen() {
  const router = useRouter();
  const { t } = useTranslation('account');

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
        <Heading size="lg" className="font-bevi-bold text-on-surface">{t('messages.pickHotel')}</Heading>
      </View>

      <HotelPickerList onSelect={pick} />
    </SafeAreaView>
  );
}
