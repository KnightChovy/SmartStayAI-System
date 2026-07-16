import { useState, useRef } from 'react';
import { View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { MessageBubble, ChatEmptyState } from '@/components/chat';
import { useChatbot } from '@/hooks/chat';
import { useGetHotels } from '@/hooks/hotels';
import { GUEST_COLORS } from '@/constants/guestTheme';


export default function ChatbotScreen() {
  const { data: hotelsData } = useGetHotels({ limit: 50 });
  const hotels = hotelsData?.results ?? [];

  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  // Chatbot gắn theo từng khách sạn (backend yêu cầu hotelId). Mặc định khách sạn đầu tiên.
  const activeHotelId = selectedHotelId ?? hotels[0]?.id ?? '';
  const activeHotel = hotels.find((h) => h.id === activeHotelId);

  const { messages, sendMessage, isStreaming, clearChat } = useChatbot(activeHotelId);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const canSend = Boolean(input.trim()) && !isStreaming && Boolean(activeHotelId);

  function handleSend() {
    if (!canSend) return;
    const text = input;
    setInput('');
    sendMessage(text);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleSelectHotel(id: string) {
    if (id === activeHotelId) return;
    setSelectedHotelId(id);
    clearChat();
    setInput('');
  }

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-hairline/30 bg-surface">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="w-9 h-9 rounded-full bg-on-surface items-center justify-center">
            <Ionicons name="sparkles" size={18} color={GUEST_COLORS.bronze} />
          </View>
          <View className="flex-1">
            <Text bold className="font-bevi-bold text-on-surface text-base">SmartStay AI</Text>
            <Text size="2xs" className={`font-bevi ${isStreaming ? 'text-green-600' : 'text-muted'}`} numberOfLines={1}>
              {isStreaming ? '● Replying...' : activeHotel ? activeHotel.name : 'Select a hotel'}
            </Text>
          </View>
        </View>

        {messages.length > 0 && (
          <Pressable onPress={clearChat} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={GUEST_COLORS.muted} />
          </Pressable>
        )}
      </View>

      {/* Hotel selector */}
      {hotels.length > 0 && (
        <View className="bg-surface border-b border-hairline/30 py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {hotels.map((h) => {
              const active = h.id === activeHotelId;
              return (
                <Pressable
                  key={h.id}
                  onPress={() => handleSelectHotel(h.id)}
                  className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? 'bg-on-surface' : 'bg-canvas'}`}
                >
                  <Ionicons name="business-outline" size={13} color={active ? GUEST_COLORS.white : GUEST_COLORS.onSurfaceVariant} />
                  <Text size="xs" bold className={`font-bevi-bold ${active ? 'text-white' : 'text-on-surface-variant'}`} numberOfLines={1}>
                    {h.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1 bg-surface"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input */}
        <View className="flex-row items-end gap-2.5 px-4 py-3 border-t border-hairline/30 bg-surface">
          <TextInput
            className="flex-1 min-h-11 max-h-28 bg-canvas rounded-[22px] px-4 py-2.5 font-bevi text-sm text-on-surface"
            placeholder={activeHotelId ? 'Type a message...' : 'Select a hotel to start...'}
            placeholderTextColor={GUEST_COLORS.muted}
            value={input}
            onChangeText={setInput}
            editable={Boolean(activeHotelId)}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit
          />
          <Pressable
            onPress={handleSend}
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
    </SafeAreaView>
  );
}
