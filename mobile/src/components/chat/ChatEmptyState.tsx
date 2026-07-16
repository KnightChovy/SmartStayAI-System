import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { GUEST_COLORS } from '@/constants/guestTheme';

/** Chỉ giữ key — câu gợi ý dịch trong render (xem `chat:empty.suggestions.*`). */
const SUGGESTION_KEYS = ['rooms', 'amenities', 'checkin'] as const;

/** Màn hình rỗng của chatbot — hiển thị gợi ý câu hỏi khi chưa có tin nhắn. */
export function ChatEmptyState() {
  const { t } = useTranslation('chat');

  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-on-surface">
        <Ionicons name="sparkles" size={34} color={GUEST_COLORS.bronze} />
      </View>
      <Heading size="lg" className="font-bevi-bold text-on-surface">
        {t('empty.title')}
      </Heading>
      <Text size="sm" className="text-center font-bevi leading-5 text-muted">
        {t('empty.subtitle')}
      </Text>
      <View className="mt-2 w-full gap-2">
        {SUGGESTION_KEYS.map(key => (
          <View key={key} className="rounded-field bg-canvas p-3">
            <Text size="sm" className="font-bevi text-on-surface-variant">
              {t(`empty.suggestions.${key}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
