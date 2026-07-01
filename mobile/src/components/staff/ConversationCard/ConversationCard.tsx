import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { StatusPill } from '@/components/staff/StatusPill';
import { CONVERSATION_STATUS_STYLE } from '@/constants/staffTheme';
import { formatDateShort } from '@/utils/formatDate';
import type { ConversationSummary } from '@/types/staff.type';

export interface ConversationCardProps {
  conversation: ConversationSummary;
  onPress?: () => void;
}

/** Thẻ hội thoại trong inbox staff — khách, preview tin cuối, trạng thái. */
export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const name = conversation.customer?.fullName ?? 'Khách vãng lai';

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-4 border border-gray-100 active:bg-gray-50"
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-2 flex-1 pr-2">
          <View className="h-9 w-9 rounded-full bg-staff-100 items-center justify-center">
            <Ionicons name="person" size={16} color="#0F766E" />
          </View>
          <View className="flex-1">
            <Text bold className="text-gray-900" numberOfLines={1}>
              {name}
            </Text>
            {conversation.subject ? (
              <Text size="xs" className="text-gray-400" numberOfLines={1}>
                {conversation.subject}
              </Text>
            ) : null}
          </View>
        </View>
        <StatusPill style={CONVERSATION_STATUS_STYLE[conversation.status]} />
      </View>

      <Text size="sm" className="text-gray-500 ml-11" numberOfLines={2}>
        {conversation.lastMessage ?? 'Chưa có tin nhắn'}
      </Text>

      {conversation.lastMessageAt ? (
        <Text size="2xs" className="text-gray-300 ml-11 mt-1.5">
          {formatDateShort(conversation.lastMessageAt)}
        </Text>
      ) : null}
    </Pressable>
  );
}
