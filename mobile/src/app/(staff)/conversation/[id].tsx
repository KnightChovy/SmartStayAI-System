import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { StaffScreenHeader, StaffEmptyState } from '@/components/staff';
import {
  useConversation,
  useReplyConversation,
  useResolveConversation,
  useStaffHotelId,
} from '@/hooks/staff';
import { cn } from '@/lib/cn';
import type { Message } from '@/types/staff.type';

/** Bong bóng tin nhắn theo người gửi. */
function MessageBubble({ message }: { message: Message }) {
  if (message.senderType === 'system') {
    return (
      <View className="items-center my-1">
        <Text
          size="2xs"
          className="text-gray-400 bg-gray-100 rounded-full px-3 py-1"
        >
          {message.content}
        </Text>
      </View>
    );
  }

  const outgoing =
    message.senderType === 'staff' || message.senderType === 'ai';
  const isAi = message.senderType === 'ai';

  return (
    <View
      className={cn('my-1 max-w-[80%]', outgoing ? 'self-end' : 'self-start')}
    >
      {isAi ? (
        <Text size="2xs" className="text-staff-500 mb-0.5 ml-1">
          AI trợ lý
        </Text>
      ) : null}
      <View
        className={cn(
          'rounded-2xl px-3.5 py-2.5',
          outgoing ? 'bg-staff-700' : 'bg-white border border-gray-100',
        )}
      >
        <Text size="sm" className={outgoing ? 'text-white' : 'text-gray-800'}>
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

  const {
    data: conversation,
    isLoading,
    isError,
    refetch,
  } = useConversation(hotelId ?? '', conversationId);
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
        setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: true }),
          100,
        );
      },
      onError: () => Alert.alert('Lỗi', 'Không gửi được tin nhắn.'),
    });
  }

  function handleResolve() {
    Alert.alert('Đánh dấu đã xử lý', 'Đóng hội thoại này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: () =>
          resolve.mutate(undefined, {
            onError: () =>
              Alert.alert('Lỗi', 'Không cập nhật được trạng thái.'),
          }),
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <StaffScreenHeader
        title={conversation?.subject ?? 'Hội thoại'}
        onBack={() => router.back()}
        right={
          conversation && !isResolved && !isClosed ? (
            <Pressable
              onPress={handleResolve}
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
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
          title="Không tải được hội thoại"
          actionLabel="Thử lại"
          onAction={refetch}
        />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 16 }}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
          >
            {conversation.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </ScrollView>

          {/* Composer */}
          {isClosed ? (
            <View className="border-t border-gray-100 bg-white p-4">
              <Text size="sm" className="text-gray-400 text-center">
                Hội thoại đã đóng — không thể trả lời.
              </Text>
            </View>
          ) : (
            <View className="border-t border-gray-100 bg-white px-3 pt-2.5 pb-2 flex-row items-end gap-2">
              <Textarea className="flex-1 bg-gray-50 border-gray-200">
                <TextareaInput
                  placeholder="Nhập trả lời…"
                  value={text}
                  onChangeText={setText}
                  multiline
                />
              </Textarea>
              <Pressable
                onPress={handleSend}
                disabled={!text.trim() || reply.isPending}
                className={cn(
                  'h-11 w-11 rounded-full items-center justify-center',
                  !text.trim() || reply.isPending
                    ? 'bg-staff-300'
                    : 'bg-staff-700',
                )}
              >
                {reply.isPending ? (
                  <Spinner color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
