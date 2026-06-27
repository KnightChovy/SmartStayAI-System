import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';

const GOLD = '#F5A623';

const SUGGESTIONS = [
  'Which hotels are best for families?',
  'Compare Deluxe and Suite rooms',
  "What's the cancellation policy?",
];

/** Màn hình rỗng của chatbot — hiển thị gợi ý câu hỏi khi chưa có tin nhắn. */
export function ChatEmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-3">
      <View className="w-18 h-18 rounded-full bg-navy items-center justify-center">
        <Ionicons name="sparkles" size={34} color={GOLD} />
      </View>
      <Heading size="lg" className="text-navy">
        SmartStay AI
      </Heading>
      <Text size="sm" className="text-gray-400 text-center leading-5">
        Ask me about hotels, bookings, or anything about your trip!
      </Text>
      <View className="gap-2 w-full mt-2">
        {SUGGESTIONS.map((q) => (
          <View key={q} className="bg-gray-100 rounded-xl p-3">
            <Text size="sm" className="text-gray-700">
              {q}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
