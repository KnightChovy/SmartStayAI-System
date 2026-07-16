import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { GUEST_COLORS } from '@/constants/guestTheme';


const SUGGESTIONS = [
  'Which hotels are best for families?',
  'Compare Deluxe and Suite rooms',
  "What's the cancellation policy?",
];

/** Màn hình rỗng của chatbot — hiển thị gợi ý câu hỏi khi chưa có tin nhắn. */
export function ChatEmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-3">
      <View className="w-20 h-20 rounded-full bg-on-surface items-center justify-center">
        <Ionicons name="sparkles" size={34} color={GUEST_COLORS.bronze} />
      </View>
      <Heading size="lg" className="font-bevi-bold text-on-surface">
        SmartStay AI
      </Heading>
      <Text size="sm" className="font-bevi text-muted text-center leading-5">
        Ask me about hotels, bookings, or anything about your trip!
      </Text>
      <View className="gap-2 w-full mt-2">
        {SUGGESTIONS.map((q) => (
          <View key={q} className="bg-canvas rounded-field p-3">
            <Text size="sm" className="font-bevi text-on-surface-variant">
              {q}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
