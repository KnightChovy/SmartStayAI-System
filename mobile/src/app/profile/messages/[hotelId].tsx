import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { HotelConversationThread } from '@/components/chat';
import { useMyConversation } from '@/hooks/messages';
import { GUEST_COLORS } from '@/constants/guestTheme';

export default function MessageThreadScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const { hotelId, name } = useLocalSearchParams<{ hotelId: string; name?: string }>();
  const id = hotelId ?? '';
  const { data: conversation } = useMyConversation(id);
  const handoff = conversation?.handoff ?? false;

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView edges={['top']} className="bg-surface">
        <View className="flex-row items-center gap-2 px-3 pt-2 pb-3 border-b border-hairline/30">
          <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
          </Pressable>
          <View className="flex-1">
            <Heading size="md" numberOfLines={1} className="font-bevi-bold text-on-surface">{name || t('account:messages.assistant')}</Heading>
            <Text size="xs" className={handoff ? 'font-bevi text-green-600' : 'font-bevi text-muted'}>
              {handoff ? t('account:messages.staffLabel') : t('account:messages.aiLabel')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
      <HotelConversationThread hotelId={id} />
    </View>
  );
}
