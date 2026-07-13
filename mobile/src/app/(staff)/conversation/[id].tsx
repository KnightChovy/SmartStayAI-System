import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { StaffScreenHeader, StaffEmptyState } from '@/components/staff';
import {
  useConversation,
  useReplyConversation,
  useResolveConversation,
  useStaffHotelId,
} from '@/hooks/staff';
import { cn } from '@/lib/cn';
import type { Message } from '@/types/staff.type';

/** Message bubble styled by sender. */
function MessageBubble({ message }: { message: Message }) {
  if (message.senderType === 'system') {
    return (
      <View className="items-center my-2">
        <Text size="2xs" className="text-gray-400 bg-gray-100 rounded-full px-3 py-1">
          {message.content}
        </Text>
      </View>
    );
  }

  const outgoing = message.senderType === 'staff' || message.senderType === 'ai';
  const isAi = message.senderType === 'ai';

  return (
    <View className={cn('my-1 max-w-[82%]', outgoing ? 'self-end' : 'self-start')}>
      {isAi ? (
        <View className="flex-row items-center gap-1 mb-0.5 ml-1">
          <Ionicons name="sparkles" size={11} color="#14B8A6" />
          <Text size="2xs" className="text-staff-500">
            AI assistant
          </Text>
        </View>
      ) : null}
      <View
        className={cn(
          'px-4 py-2.5',
          outgoing
            ? 'bg-staff-700 rounded-t-2xl rounded-bl-2xl rounded-br-md'
            : 'bg-white border border-gray-100 rounded-t-2xl rounded-br-2xl rounded-bl-md'
        )}
      >
        <Text size="sm" className={outgoing ? 'text-white leading-5' : 'text-gray-800 leading-5'}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export default function StaffConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const conversationId = id ?? '';
  const scrollRef = useRef<ScrollView>(null);

  const { data: conversation, isLoading, isError, refetch } = useConversation(
    hotelId ?? '',
    conversationId
  );
  const reply = useReplyConversation(hotelId ?? '', conversationId);
  const resolve = useResolveConversation(hotelId ?? '', conversationId);
  const [text, setText] = useState('');

  const isClosed = conversation?.status === 'closed';
  const isResolved = conversation?.status === 'resolved';

  function handleSend() {
    const message = text.trim();
    if (!message) return;
    reply.mutate(message, {
      onSuccess: () => {
        setText('');
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      },
      onError: () => Alert.alert('Error', "Couldn't send the message."),
    });
  }

  function handleResolve() {
    Alert.alert('Mark as resolved', 'Close this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () =>
          resolve.mutate(undefined, {
            onError: () => Alert.alert('Error', "Couldn't update the status."),
          }),
      },
    ]);
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader
        title={conversation?.subject ?? 'Conversation'}
        onBack={() => router.back()}
        right={
          conversation && !isResolved && !isClosed ? (
            <Pressable
              onPress={handleResolve}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
            >
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            </Pressable>
          ) : null
        }
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : isError || !conversation ? (
        <StaffEmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load conversation"
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <SafeAreaView className="flex-1" edges={['bottom']}>
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
              {conversation.messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </ScrollView>

            {/* Composer */}
            {isClosed ? (
              <View className="border-t border-gray-100 bg-white p-4">
                <Text size="sm" className="text-gray-400 text-center">
                  This conversation is closed — you can't reply.
                </Text>
              </View>
            ) : (
              <View className="border-t border-gray-100 bg-white px-3 pt-2.5 pb-2 flex-row items-end gap-2">
                <TextInput
                  placeholder="Type a reply…"
                  placeholderTextColor="#9CA3AF"
                  value={text}
                  onChangeText={setText}
                  multiline
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-gray-900 text-base max-h-28"
                />
                <Pressable
                  onPress={handleSend}
                  disabled={!text.trim() || reply.isPending}
                  className={cn(
                    'h-11 w-11 rounded-full items-center justify-center',
                    !text.trim() || reply.isPending ? 'bg-staff-300' : 'bg-staff-700'
                  )}
                >
                  {reply.isPending ? (
                    <Spinner color="#FFFFFF" />
                  ) : (
                    <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </View>
  );
}
