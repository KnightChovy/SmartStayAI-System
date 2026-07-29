import { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { ChatHistoryDrawer, MessageBubble, RenameSessionDialog } from '@/components/chat';
import { useChatbot } from '@/hooks/chat';
import { GUEST_COLORS } from '@/constants/guestTheme';
import type { ChatMessage, ChatSession } from '@/hooks/chat';


export default function ChatbotScreen() {
  const { t } = useTranslation(['chat', 'common']);
  const greeting = useMemo<ChatMessage>(() => ({
    id: 'greeting',
    role: 'assistant',
    text: t('chat:greeting'),
    quickReplies: [t('chat:quick.stays'), t('chat:quick.hanoi'), t('chat:quick.suggest')],
  }), [t]);
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
      t('chat:history.deleteMessage', { title: session.title || t('chat:history.untitled') }),
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

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between gap-2 border-b border-hairline/30 bg-surface px-4 py-3">
        <Pressable
          onPress={() => setDrawerOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('chat:history.open')}
        >
          <Ionicons name="menu" size={24} color={GUEST_COLORS.onSurface} />
        </Pressable>

        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-on-surface">
            <Ionicons name="sparkles" size={19} color={GUEST_COLORS.bronze} />
            <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-green-500" />
          </View>
          <View className="flex-1">
            <Text bold className="font-bevi-bold text-on-surface text-base">SmartStay AI</Text>
            <Text size="2xs" className={`font-bevi ${isStreaming ? 'text-green-600' : 'text-muted'}`} numberOfLines={1}>
              {isStreaming ? t('chat:replying') : t('chat:subtitle')}
            </Text>
          </View>
        </View>

        {/* Đổi đoạn giữa lượt stream sẽ khiến chunk đổ vào tin đã biến mất khỏi màn hình. */}
        <Pressable
          onPress={handleNewChat}
          disabled={isStreaming}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('chat:history.newChat')}
          accessibilityState={{ disabled: isStreaming }}
          className={isStreaming ? 'opacity-40' : undefined}
        >
          <Ionicons name="create-outline" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
      </View>

      {/* Messages */}
      {/*
        Android tự co window theo bàn phím (`windowSoftInputMode` mặc định là `resize`), thêm
        behavior `height` là co HAI LẦN — khung chat bị hụt đúng bằng chiều cao bàn phím.
        Chỉ iOS cần né bằng padding.
      */}
      <KeyboardAvoidingView
        className="flex-1 bg-surface"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/*
          `inverted`: list bị lật ngược nên gốc toạ độ (offset 0) nằm ở ĐÁY. Nhờ đó tin mới nhất
          luôn tự dính đáy mà KHÔNG cần bất kỳ lời gọi `scrollToEnd` nào — kể cả khi bàn phím mở
          làm khung co lại, hay khi bong bóng cao dần theo từng chunk SSE. Cách cũ (list thường +
          ép cuộn) luôn phải chạy đua với layout nên mới có cảnh tin cuối bị composer che.
          `keyboardDismissMode="interactive"`: vuốt vẫn cuộn bình thường trong lúc bàn phím đang mở,
          chỉ khi kéo xuống chạm bàn phím mới đóng — `on-drag` trước đây đóng ngay từ cú vuốt đầu.
        */}
        <FlatList
          inverted
          className="flex-1"
          data={invertedMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} onQuickReply={handleSend} />}
          // Ít tin (vừa vào, mới có lời chào) thì content ngắn hơn khung: mặc định `inverted` sẽ dồn
          // xuống đáy màn hình, nhìn như hội thoại đã chạy dở. `flexGrow` cho container cao bằng
          // khung, `justify-end` đẩy tin về cuối trục CHƯA LẬT — sau khi lật thành ra nằm trên đầu.
          // Khi content dài hơn khung thì 2 thuộc tính này tự vô hiệu, list cuộn như thường.
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: 12,
            paddingBottom: 12,
          }}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View className="flex-row items-end gap-2.5 border-t border-hairline/30 bg-surface px-4 py-3">
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
              <Ionicons name="send" size={18} color={canSend ? GUEST_COLORS.white : GUEST_COLORS.muted} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
}
