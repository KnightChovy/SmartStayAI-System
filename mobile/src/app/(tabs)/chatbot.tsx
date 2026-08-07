import { useEffect, useMemo, useRef, useState } from 'react';

import {
  View,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import {
  ChatHistoryDrawer,
  HotelConversationThread,
  HotelPickerList,
  MessageBubble,
  RenameSessionDialog,
} from '@/components/chat';
import { useChatbot } from '@/hooks/chat';
import { GUEST_COLORS } from '@/constants/guestTheme';
import { cn } from '@/lib/cn';
import type { ChatMessage, ChatSession } from '@/hooks/chat';
import type { HotelSearchResult } from '@/types/hotels.type';

type ChatScope = 'platform' | 'hotel';

export default function ChatbotScreen() {
  const { t } = useTranslation(['chat', 'common']);
  const router = useRouter();
  const params = useLocalSearchParams<{ hotelId?: string; hotelName?: string }>();

  const greeting = useMemo<ChatMessage>(
    () => ({
      id: 'greeting',
      role: 'assistant',
      text: t('chat:greeting'),
      quickReplies: [
        t('chat:quick.stays'),
        t('chat:quick.hanoi'),
        t('chat:quick.suggest'),
      ],
    }),
    [t],
  );
  const {
    messages,
    sendMessage,
    isStreaming,
    sessions,
    activeSessionId,
    newChat,
    openSession,
    renameSession,
    deleteSession,
  } = useChatbot({ initialMessage: greeting });
  const [input, setInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [renaming, setRenaming] = useState<ChatSession | null>(null);

  // Hai luồng TÁCH BIỆT: `useChatbot()` (đoạn chat toàn sàn) luôn sống ở đây bất kể
  // đang hiển thị scope nào — chuyển qua "Khách sạn này" rồi quay lại không mất tin.
  const [scope, setScope] = useState<ChatScope>('platform');
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Mở tab Chat từ trang chi tiết KS (?hotelId=&hotelName=) → nhảy thẳng vào scope đó.
  const appliedParamRef = useRef<string | null>(null);
  useEffect(() => {
    if (!params.hotelId || appliedParamRef.current === params.hotelId) return;
    appliedParamRef.current = params.hotelId;
    setHotelId(params.hotelId);
    setHotelName(params.hotelName ?? null);
    setScope('hotel');
  }, [params.hotelId, params.hotelName]);

  // List chạy `inverted`: index 0 nằm ở ĐÁY màn hình, nên phải đảo thứ tự tin nhắn.
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const canSend = Boolean(input.trim()) && !isStreaming;

  function handleSend(quickReply?: string) {
    const text = quickReply ?? input;
    if (!text.trim() || isStreaming) return;
    setInput('');
    sendMessage(text);
  }

  function handleNewChat() {
    newChat();
    setDrawerOpen(false);
  }

  function handleSelectSession(sessionId: string) {
    openSession(sessionId);
    setDrawerOpen(false);
  }

  /** Đóng drawer TRƯỚC rồi mới mở dialog: hai `Modal` chồng nhau không đáng tin trên iOS. */
  function handleRequestRename(session: ChatSession) {
    setDrawerOpen(false);
    setRenaming(session);
  }

  function handleRequestDelete(session: ChatSession) {
    Alert.alert(
      t('chat:history.deleteTitle'),
      t('chat:history.deleteMessage', {
        title: session.title || t('chat:history.untitled'),
      }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('chat:history.delete'),
          style: 'destructive',
          onPress: () => deleteSession(session.id),
        },
      ],
    );
  }

  function handlePickHotel(hotel: HotelSearchResult) {
    setHotelId(hotel.id);
    setHotelName(hotel.name);
    setScope('hotel');
    setPickerOpen(false);
  }

  function handleHotelPillPress() {
    if (hotelId) {
      setScope('hotel');
    } else {
      setPickerOpen(true);
    }
  }

  const isPlatform = scope === 'platform';

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header */}
      <View className="border-b border-hairline/30 bg-surface px-4 py-3">
        <View className="flex-row items-center justify-between gap-2">
          {isPlatform ? (
            <Pressable
              onPress={() => setDrawerOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('chat:history.open')}
            >
              <Ionicons name="menu" size={24} color={GUEST_COLORS.onSurface} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common:back')}
            >
              <Ionicons name="chevron-back" size={24} color={GUEST_COLORS.onSurface} />
            </Pressable>
          )}

          <View className="flex-row items-center gap-2.5 flex-1">
            <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-on-surface">
              <Ionicons
                name={isPlatform ? 'sparkles' : 'business'}
                size={19}
                color={GUEST_COLORS.bronze}
              />
              <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-green-500" />
            </View>
            <View className="flex-1">
              <Text bold numberOfLines={1} className="font-bevi-bold text-on-surface text-base">
                {isPlatform ? t('chat:assistantName') : hotelName || t('chat:scope.hotel')}
              </Text>
              <Text
                size="2xs"
                className={`font-bevi ${isPlatform && isStreaming ? 'text-green-600' : 'text-muted'}`}
                numberOfLines={1}
              >
                {isPlatform ? (isStreaming ? t('chat:replying') : t('chat:subtitle')) : t('chat:scope.hotel')}
              </Text>
            </View>
          </View>

          {isPlatform ? (
            // Đổi đoạn giữa lượt stream sẽ khiến chunk đổ vào tin đã biến mất khỏi màn hình.
            <Pressable
              onPress={handleNewChat}
              disabled={isStreaming}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('chat:history.newChat')}
              accessibilityState={{ disabled: isStreaming }}
              className={isStreaming ? 'opacity-40' : undefined}
            >
              <Ionicons
                name="create-outline"
                size={22}
                color={GUEST_COLORS.onSurface}
              />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setPickerOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('chat:scope.change')}
            >
              <Ionicons name="swap-horizontal" size={22} color={GUEST_COLORS.onSurface} />
            </Pressable>
          )}
        </View>

        {/* Toàn sàn ⇄ Khách sạn này — 2 luồng state tách biệt, đổi tab không mất tin đang gõ */}
        <View className="flex-row bg-surface-low rounded-full p-1 mt-3 self-start">
          <Pressable
            onPress={() => setScope('platform')}
            className={cn('flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full', isPlatform ? 'bg-on-surface' : '')}
          >
            <Ionicons name="sparkles" size={13} color={isPlatform ? '#FFFFFF' : GUEST_COLORS.muted} />
            <Text size="xs" bold className={isPlatform ? 'font-bevi-bold text-white' : 'font-bevi text-muted'}>
              {t('chat:scope.platform')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleHotelPillPress}
            className={cn('flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full', !isPlatform ? 'bg-on-surface' : '')}
          >
            <Ionicons name="business" size={13} color={!isPlatform ? '#FFFFFF' : GUEST_COLORS.muted} />
            <Text size="xs" bold numberOfLines={1} className={!isPlatform ? 'font-bevi-bold text-white' : 'font-bevi text-muted'}>
              {hotelId ? hotelName || t('chat:scope.hotel') : t('chat:scope.choose')}
            </Text>
          </Pressable>
        </View>
      </View>

      {isPlatform ? (
        <KeyboardAvoidingView
          className="flex-1 bg-surface"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            inverted
            className="flex-1"
            data={invertedMessages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} onQuickReply={handleSend} />
            )}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'flex-end',
              paddingTop: 12,
              paddingBottom: 12,
            }}
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />

          {/* Input */}
          <View className="flex-row items-end gap-2.5 border-t border-hairline/30 bg-surface px-4 py-3 pb-6">
            <TextInput
              className="flex-1 min-h-11 max-h-28 rounded-[22px] border border-hairline/40 bg-canvas px-4 py-2.5 font-bevi text-sm text-on-surface"
              placeholder={t('chat:inputPlaceholder')}
              placeholderTextColor={GUEST_COLORS.muted}
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              blurOnSubmit
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={!canSend}
              className={`w-11 h-11 rounded-full items-center justify-center ${canSend ? 'bg-on-surface' : 'bg-surface-container'}`}
            >
              {isStreaming ? (
                <ActivityIndicator size="small" color={GUEST_COLORS.muted} />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={canSend ? GUEST_COLORS.white : GUEST_COLORS.muted}
                />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : hotelId ? (
        <HotelConversationThread hotelId={hotelId} active={scope === 'hotel'} />
      ) : null}

      <ChatHistoryDrawer
        visible={drawerOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        disabled={isStreaming}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleSelectSession}
        onNewChat={handleNewChat}
        onRequestRename={handleRequestRename}
        onRequestDelete={handleRequestDelete}
      />

      <RenameSessionDialog
        visible={Boolean(renaming)}
        initialTitle={renaming?.title ?? ''}
        onCancel={() => setRenaming(null)}
        onSubmit={(title) => {
          if (renaming) renameSession(renaming.id, title);
          setRenaming(null);
        }}
      />

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        {/* `Modal` của RN mở ra một cửa sổ native RIÊNG — `SafeAreaProvider` ở gốc app không
            đo được inset cho nội dung bên trong, nên `edges={['top']}` trả về 0 và header đè
            lên status bar. Phải bọc thêm một `SafeAreaProvider` lồng ngay trong Modal để nó
            tự đo lại theo đúng cửa sổ này (cách khắc phục chính thức của thư viện). */}
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
            <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={8} className="w-9 h-9 items-center justify-center">
                <Ionicons name="close" size={22} color={GUEST_COLORS.onSurface} />
              </Pressable>
              <Heading size="lg" className="font-bevi-bold text-on-surface">{t('chat:scope.pickerTitle')}</Heading>
            </View>
            <HotelPickerList onSelect={handlePickHotel} />
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
}
