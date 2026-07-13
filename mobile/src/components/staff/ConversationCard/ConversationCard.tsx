import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/staff/Card';
import { StatusPill } from '@/components/staff/StatusPill';
import { CONVERSATION_STATUS_STYLE } from '@/constants/staffTheme';
import { formatDateShort } from '@/utils/formatDate';
import type { ConversationSummary } from '@/types/staff.type';

export interface ConversationCardProps {
  conversation: ConversationSummary;
  onPress?: () => void;
}

/** Inbox conversation card — guest, last-message preview, status. */
export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const name = conversation.customer?.fullName ?? 'Guest';
  const initial = name.charAt(0).toUpperCase();

  return (
    <Pressable onPress={onPress} className="active:opacity-90">
      <Card className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center gap-3 flex-1 pr-2">
            <View className="h-11 w-11 rounded-2xl bg-staff-50 items-center justify-center">
              <Text bold className="text-staff-700 text-base">
                {initial}
              </Text>
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

        <Text size="sm" className="text-gray-500 leading-5" numberOfLines={2}>
          {conversation.lastMessage ?? 'No messages yet'}
        </Text>

        {conversation.lastMessageAt ? (
          <View className="flex-row items-center gap-1 mt-2">
            <Ionicons name="time-outline" size={12} color="#CBD5E1" />
            <Text size="2xs" className="text-gray-300">
              {formatDateShort(conversation.lastMessageAt)}
            </Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
