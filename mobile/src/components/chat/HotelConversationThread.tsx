import { useEffect, useMemo, useState } from 'react';
import { View, FlatList, Pressable, TextInput, Keyboard, Platform, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinkifiedText } from '@/components/shared/LinkifiedText';
import { Text } from '@/components/ui/text';
import { TypingDots } from './TypingDots';
import { useMyConversation, useSendMessage, useSetConversationMode } from '@/hooks/messages';
import { formatTime } from '@/utils/formatDate';
import { cn } from '@/lib/cn';
import type { ConversationMessage, ConversationMode } from '@/types/messages.type';
import { GUEST_COLORS } from '@/constants/guestTheme';

/** Bong bóng "đang trả lời…" — hiện khi đã gửi tin nhưng phản hồi (AI hoặc lễ tân) chưa
 *  về tới nơi. Không có chỉ báo nào trước đây khiến sau khi gửi màn hình trông như đứng im. */
function TypingIndicatorRow({ label }: { label: string }) {
  return (
    <View className="my-1 max-w-[82%] self-start">
      <View className="flex-row items-center gap-1 mb-0.5 ml-1">
        <Ionicons name="sparkles" size={11} color={GUEST_COLORS.bronze} />
        <Text size="xs" className="font-bevi text-bronze">{label}</Text>
      </View>
      <View className="px-4 py-3 bg-surface border border-hairline/40 rounded-t-2xl rounded-br-2xl rounded-bl-md">
        <TypingDots />
      </View>
    </View>
  );
}

function ThreadBubble({ message, aiLabel, staffLabel }: { message: ConversationMessage; aiLabel: string; staffLabel: string }) {
  const { t } = useTranslation('chat');

  if (message.senderType === 'system') {
    return (
      <View className="items-center my-2">
        <Text size="xs" className="font-bevi text-muted bg-surface-low rounded-full px-3 py-1 text-center">{message.content}</Text>
      </View>
    );
  }

  const outgoing = message.senderType === 'user';
  const isStaff = message.senderType === 'staff';

  return (
    <View className={cn('my-1 max-w-[82%]', outgoing ? 'self-end' : 'self-start')}>
      {!outgoing ? (
        <View className="flex-row items-center gap-1 mb-0.5 ml-1">
          <Ionicons name={isStaff ? 'headset' : 'sparkles'} size={11} color={isStaff ? '#059669' : GUEST_COLORS.bronze} />
          <Text size="xs" className={isStaff ? 'font-bevi text-green-600' : 'font-bevi text-bronze'}>{isStaff ? staffLabel : aiLabel}</Text>
        </View>
      ) : null}
      <View
        className={cn(
          'px-4 py-2.5',
          outgoing
            ? 'bg-on-surface rounded-t-2xl rounded-bl-2xl rounded-br-md'
            : isStaff
              ? 'bg-green-50 border border-green-100 rounded-t-2xl rounded-br-2xl rounded-bl-md'
              : 'bg-surface border border-hairline/40 rounded-t-2xl rounded-br-2xl rounded-bl-md',
        )}
      >
        <LinkifiedText
          size="sm"
          className={cn('font-bevi leading-5', outgoing ? 'text-white' : 'text-on-surface')}
          linkClassName={cn('font-bevi-bold underline', outgoing ? 'text-white' : 'text-bronze')}
          payLabel={t('payNow')}
          qrLabel={t('qrAlt')}
          text={message.content}
        />
      </View>
      <Text size="xs" className={cn('font-bevi text-muted mt-0.5', outgoing ? 'text-right mr-1' : 'ml-1')}>{formatTime(message.createdAt)}</Text>
    </View>
  );
}

export interface HotelConversationThreadProps {
  hotelId: string;
  /** `false` chỉ khi tab này đang không hiển thị — dừng polling cho đỡ tốn (mặc định `true`). */
  active?: boolean;
}

/** Khung hội thoại guest ↔ khách sạn (AI concierge hoặc lễ tân) cho MỘT khách sạn.
 *  Tách khỏi `profile/messages/[hotelId].tsx` để dùng lại được ở tab Chat (chế độ
 *  "Khách sạn này") mà không chép lại logic — cùng data layer, cùng hành vi.
 *
 *  Dùng `FlatList inverted` (KHÔNG phải `ScrollView` + gọi `scrollToEnd()` thủ công):
 *  đã thử ScrollView qua nhiều vòng vá (flex-1, bỏ flexGrow, scroll tường minh sau khi
 *  gửi + khi focus…) vẫn không dứt điểm — RN đo `onContentSizeChange` của ScrollView lồng
 *  trong `KeyboardAvoidingView` không đáng tin cậy 100% trên mọi thiết bị. Tab "Toàn sàn"
 *  (`(tabs)/chatbot.tsx`) dùng `FlatList inverted` và CHƯA từng bị báo lỗi cuộn: index 0
 *  nằm ở ĐÁY màn hình nên tin mới nhất tự dính đáy, không cần một lời gọi cuộn nào.
 *
 *  Tránh bàn phím: đúng nguyên bản `KeyboardAvoidingView` (`behavior="padding"` chỉ iOS)
 *  + lắng nghe `Keyboard` để tính padding composer — cùng cơ chế `(staff)/conversation/[id].tsx`
 *  và tab "Toàn sàn" đang dùng, không tự sáng tạo cách khác để mọi màn chat cư xử giống nhau. */
export function HotelConversationThread({ hotelId, active = true }: HotelConversationThreadProps) {
  const { t } = useTranslation(['account', 'common']);
  const insets = useSafeAreaInsets();

  // Bàn phím đang mở thì phần đệm dưới do `KeyboardAvoidingView` lo (nó đã bao cả vùng home
  // indicator); đóng lại mới cần safe-area.
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const { data: conversation, isLoading, isError, refetch } = useMyConversation(hotelId, active);
  const send = useSendMessage(hotelId);
  const setMode = useSetConversationMode(hotelId);
  const [draft, setDraft] = useState('');

  const conversationId = conversation?.id ?? '';
  const handoff = conversation?.handoff ?? false;
  const activeMode: ConversationMode = handoff ? 'human' : 'ai';

  // Tin của khách hiện NGAY khi bấm gửi (optimistic), không chờ round-trip: `send.mutateAsync`
  // chỉ trả về sau khi backend đã xử lý XONG cả câu trả lời (LLM có thể mất vài giây), còn
  // `conversation.messages` chỉ cập nhật sau khi refetch xong ⇒ không có optimistic thì suốt
  // thời gian chờ, khách gõ xong bấm gửi mà MÀN HÌNH KHÔNG HIỆN GÌ CẢ (không thấy tin mình vừa
  // gửi, cũng chưa thấy trả lời) — trông như đứng im/mất tin. Xoá khi refetch xong (dữ liệu
  // thật đã thay thế) hoặc khi gửi lỗi.
  const [pendingMessage, setPendingMessage] = useState<ConversationMessage | null>(null);

  // List chạy `inverted`: phải đảo thứ tự tin nhắn (giống hệt tab Toàn sàn).
  const invertedMessages = useMemo(() => {
    const base = conversation?.messages ? [...conversation.messages] : [];
    if (pendingMessage) base.push(pendingMessage);
    return base.reverse();
  }, [conversation?.messages, pendingMessage]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || send.isPending) return;
    setDraft('');
    setPendingMessage({
      id: `pending-${Date.now()}`,
      conversationId: conversationId || '',
      senderType: 'user',
      senderId: null,
      content: text,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    });
    try {
      await send.mutateAsync({ hotelId, message: text, ...(conversationId ? { conversationId } : {}) });
      // Đợi dữ liệu thật về rồi mới bỏ optimistic — bỏ ngay sau `mutateAsync` sẽ có một nhịp
      // tin của khách BIẾN MẤT trước khi refetch (chạy nền, không đồng bộ) kịp trả về.
      await refetch();
    } catch {
      setDraft(text);
      Alert.alert(t('account:messages.sendError'));
    } finally {
      setPendingMessage(null);
    }
  }

  function switchMode(mode: ConversationMode) {
    if (!conversationId || mode === activeMode || setMode.isPending) return;
    const run = () =>
      setMode.mutate(
        { conversationId, mode },
        { onError: () => Alert.alert(t('account:messages.modeError')) },
      );
    if (mode === 'human') {
      Alert.alert(t('account:messages.requestStaff'), t('account:messages.requestStaffConfirm'), [
        { text: t('common:cancel'), style: 'cancel' },
        { text: t('common:ok'), onPress: run },
      ]);
    } else {
      run();
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={GUEST_COLORS.onSurface} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="cloud-offline-outline" size={40} color={GUEST_COLORS.muted} />
        <Text className="font-bevi text-muted text-center mt-3">{t('account:messages.threadError')}</Text>
        <Pressable onPress={() => refetch()} className="mt-4 bg-on-surface rounded-card px-5 py-2.5">
          <Text bold className="font-bevi-bold text-white">{t('common:retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const showTyping = send.isPending;

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {handoff ? (
        <View className="bg-green-50 border-b border-green-100 px-4 py-2.5 flex-row items-center gap-2">
          <Ionicons name="headset" size={16} color="#059669" />
          <Text size="sm" className="font-bevi text-green-700 flex-1">{t('account:messages.handoffBanner')}</Text>
        </View>
      ) : null}

      {invertedMessages.length === 0 && !showTyping ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="chatbubble-ellipses-outline" size={34} color={GUEST_COLORS.muted} />
          <Text className="font-bevi text-muted text-center mt-3">{t('account:messages.startHint')}</Text>
        </View>
      ) : (
        <FlatList
          inverted
          className="flex-1"
          data={invertedMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <ThreadBubble message={item} aiLabel={t('account:messages.aiLabel')} staffLabel={t('account:messages.staffLabel')} />
          )}
          // Đã gửi tin nhưng phản hồi chưa về: bong bóng "đang trả lời…" — list đảo nên
          // `ListHeaderComponent` render TRƯỚC `data[0]` (tin mới nhất), tức nằm dưới nó,
          // ngay trên composer. Không có chỉ báo này thì gửi xong màn hình trông như đứng im
          // trong lúc chờ (LLM/lễ tân có thể mất vài giây).
          ListHeaderComponent={showTyping ? <TypingIndicatorRow label={t('account:messages.aiLabel')} /> : null}
          // Ít tin thì content ngắn hơn khung: `flexGrow`+`justify-end` đẩy tin về đáy thay vì
          // dồn lên đầu màn hình. Content dài hơn khung thì 2 thuộc tính này tự vô hiệu, list
          // cuộn như thường — đúng công thức đã verify ở tab Toàn sàn.
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            padding: 16,
          }}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* AI ⇄ Nhân viên toggle (chỉ khi hội thoại đã tồn tại) */}
      {conversationId ? (
        <View className="px-3 pt-2">
          <View className="flex-row bg-surface-low rounded-full p-1 self-center">
            {(['ai', 'human'] as const).map((mode) => {
              const isActive = activeMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => switchMode(mode)}
                  disabled={setMode.isPending}
                  className={cn('flex-row items-center gap-1.5 px-4 py-1.5 rounded-full', isActive ? 'bg-on-surface' : '')}
                >
                  <Ionicons
                    name={mode === 'ai' ? 'sparkles' : 'headset'}
                    size={13}
                    color={isActive ? '#FFFFFF' : GUEST_COLORS.muted}
                  />
                  <Text size="xs" bold className={isActive ? 'font-bevi-bold text-white' : 'font-bevi text-muted'}>
                    {mode === 'ai' ? t('account:messages.modeAi') : t('account:messages.modeHuman')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Composer — bàn phím MỞ thì KeyboardAvoidingView đã đẩy đủ, chỉ cần đệm nhỏ cố định;
          bàn phím ĐÓNG mới cần mức sàn Math.max(insets.bottom,12) (gesture bar/home indicator).
          Tự lo được kể cả khi nhúng trong màn KHÔNG bọc SafeAreaView(bottom). */}
      <View
        className="border-t border-hairline/30 bg-surface px-3 pt-2.5 flex-row items-end gap-2"
        style={{ paddingBottom: isKeyboardOpen ? 12 : Math.max(insets.bottom, 12) }}
      >
        <TextInput
          placeholder={t('account:messages.composerPlaceholder')}
          placeholderTextColor={GUEST_COLORS.muted}
          value={draft}
          onChangeText={setDraft}
          multiline
          className="flex-1 bg-surface-low border border-hairline/40 rounded-2xl px-4 py-2.5 text-on-surface text-sm max-h-28 font-bevi"
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || send.isPending}
          className={cn('h-11 w-11 rounded-full items-center justify-center', !draft.trim() || send.isPending ? 'bg-hairline' : 'bg-on-surface')}
        >
          {send.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="arrow-up" size={20} color="#FFFFFF" />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
