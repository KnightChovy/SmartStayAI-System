import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import type { ChatMessage } from '@/hooks/chat';
import { TypingDots } from './TypingDots';

const GOLD = '#F5A623';

export interface MessageBubbleProps {
  message: ChatMessage;
}

/** Bong bóng tin nhắn cho một dòng chat (user hoặc AI), hỗ trợ trạng thái streaming/error. */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View className={`flex-row items-end mb-3 px-4 py-3 gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-navy items-center justify-center">
          <Ionicons name="sparkles" size={16} color={GOLD} />
        </View>
      )}

      <View
        className={`max-w-[75%] px-3.5 py-2.5 rounded-[18px] ${
          isUser
            ? 'bg-navy rounded-br-[4px]'
            : message.error
              ? 'bg-red-50 rounded-bl-[4px]'
              : 'bg-gray-100 rounded-bl-[4px]'
        }`}
      >
        {message.streaming && message.text === '' ? (
          <TypingDots />
        ) : (
          <Text
            size="md"
            className={isUser ? 'text-white' : message.error ? 'text-red-600' : 'text-gray-800'}
          >
            {message.text}
            {message.streaming ? '▌' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}
