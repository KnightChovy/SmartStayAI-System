import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinkifiedText } from '@/components/shared/LinkifiedText';
import { Text } from '@/components/ui/text';
import type { ChatMessage } from '@/hooks/chat';
import { TypingDots } from './TypingDots';
import { GUEST_COLORS } from '@/constants/guestTheme';


export interface MessageBubbleProps {
  message: ChatMessage;
  onQuickReply?: (message: string) => void;
}

/** Bong bóng tin nhắn cho một dòng chat (user hoặc AI), hỗ trợ trạng thái streaming/error. */
export function MessageBubble({ message, onQuickReply }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View
      className={`flex-row items-end px-4 py-2 gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <View className="mb-0.5 h-8 w-8 items-center justify-center rounded-full border border-hairline/30 bg-surface-container">
          <Ionicons name="sparkles" size={16} color={GUEST_COLORS.bronze} />
        </View>
      )}

      <View className={`max-w-[82%] gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <Text size="2xs" bold className="font-bevi-bold text-muted">
            SmartStay AI
          </Text>
        )}
        <View
          className={`px-3.5 py-2.5 rounded-[18px] ${
            isUser
              ? 'bg-on-surface rounded-br-[4px]'
              : message.error
                ? 'bg-red-50 rounded-bl-[4px]'
                : 'border border-hairline/30 bg-canvas rounded-bl-[4px]'
          }`}
        >
          {message.streaming && message.text === '' ? (
            <TypingDots />
          ) : (
            <LinkifiedText
              size="sm"
              className={isUser ? 'text-white' : message.error ? 'text-red-600' : 'text-on-surface'}
              linkClassName={isUser ? 'text-white underline font-bold' : 'text-bronze underline font-bold'}
              text={`${message.text}${message.streaming ? '▌' : ''}`}
            />
          )}
        </View>

        {!isUser && message.quickReplies && message.quickReplies.length > 0 && (
          <View className="mt-1 flex-row flex-wrap gap-2">
            {message.quickReplies.map(reply => (
              <Pressable
                key={reply}
                accessibilityRole="button"
                accessibilityLabel={reply}
                onPress={() => onQuickReply?.(reply)}
                className="rounded-full border border-on-surface/20 bg-surface px-3 py-2"
              >
                <Text size="xs" bold className="font-bevi-bold text-on-surface">
                  {reply}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
