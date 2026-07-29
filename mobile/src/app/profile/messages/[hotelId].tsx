import { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useMyConversation, useSendMessage, useSetConversationMode } from '@/hooks/messages';
import { formatTime } from '@/utils/formatDate';
import { cn } from '@/lib/cn';
import type { ConversationMessage, ConversationMode } from '@/types/messages.type';
import { GUEST_COLORS } from '@/constants/guestTheme';

function MessageBubble({ message, aiLabel, staffLabel }: { message: ConversationMessage; aiLabel: string; staffLabel: string }) {
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
        <Text size="sm" className={cn('font-bevi leading-5', outgoing ? 'text-white' : 'text-on-surface')}>{message.content}</Text>
      </View>
      <Text size="xs" className={cn('font-bevi text-muted mt-0.5', outgoing ? 'text-right mr-1' : 'ml-1')}>{formatTime(message.createdAt)}</Text>
    </View>
  );
}

export default function MessageThreadScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const { hotelId, name } = useLocalSearchParams<{ hotelId: string; name?: string }>();
  const id = hotelId ?? '';
  const scrollRef = useRef<ScrollView>(null);

  const { data: conversation, isLoading, isError, refetch } = useMyConversation(id);
  const send = useSendMessage(id);
  const setMode = useSetConversationMode(id);
  const [draft, setDraft] = useState('');

  const conversationId = conversation?.id ?? '';
  const handoff = conversation?.handoff ?? false;
  const activeMode: ConversationMode = handoff ? 'human' : 'ai';

  const prevCount = useRef(0);
  useEffect(() => {
    const count = conversation?.messages.length ?? 0;
    if (count !== prevCount.current) {
      prevCount.current = count;
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [conversation?.messages.length]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || send.isPending) return;
    setDraft('');
    try {
      await send.mutateAsync({ hotelId: id, message: text, ...(conversationId ? { conversationId } : {}) });
    } catch {
      setDraft(text);
      Alert.alert(t('account:messages.sendError'));
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

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView edges={['top']} className="bg-surface">
        <View className="flex-row items-center gap-2 px-3 pt-2 pb-3 border-b border-hairline/30">
          <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
          </Pressable>
          <View className="flex-1">
            <Heading size="md" numberOfLines={1} className="font-bevi-bold text-on-surface">{name || t('account:messages.assistant')}</Heading>
            <Text size="xs" className={handoff ? 'font-bevi text-green-600' : 'font-bevi text-muted'}>
              {handoff ? t('account:messages.staffLabel') : t('account:messages.aiLabel')}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={GUEST_COLORS.onSurface} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={40} color={GUEST_COLORS.muted} />
          <Text className="font-bevi text-muted text-center mt-3">{t('account:messages.threadError')}</Text>
          <Pressable onPress={() => refetch()} className="mt-4 bg-on-surface rounded-card px-5 py-2.5">
            <Text bold className="font-bevi-bold text-white">{t('common:retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <SafeAreaView className="flex-1" edges={['bottom']}>
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
            {handoff ? (
              <View className="bg-green-50 border-b border-green-100 px-4 py-2.5 flex-row items-center gap-2">
                <Ionicons name="headset" size={16} color="#059669" />
                <Text size="sm" className="font-bevi text-green-700 flex-1">{t('account:messages.handoffBanner')}</Text>
              </View>
            ) : null}

            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
              {!conversation || conversation.messages.length === 0 ? (
                <View className="items-center mt-10 px-6">
                  <Ionicons name="chatbubble-ellipses-outline" size={34} color={GUEST_COLORS.muted} />
                  <Text className="font-bevi text-muted text-center mt-3">{t('account:messages.startHint')}</Text>
                </View>
              ) : (
                conversation.messages.map((m) => (
                  <MessageBubble key={m.id} message={m} aiLabel={t('account:messages.aiLabel')} staffLabel={t('account:messages.staffLabel')} />
                ))
              )}
            </ScrollView>

            {/* AI ⇄ Nhân viên toggle (chỉ khi hội thoại đã tồn tại) */}
            {conversationId ? (
              <View className="px-3 pt-2">
                <View className="flex-row bg-surface-low rounded-full p-1 self-center">
                  {(['ai', 'human'] as const).map((mode) => {
                    const active = activeMode === mode;
                    return (
                      <Pressable
                        key={mode}
                        onPress={() => switchMode(mode)}
                        disabled={setMode.isPending}
                        className={cn('flex-row items-center gap-1.5 px-4 py-1.5 rounded-full', active ? 'bg-on-surface' : '')}
                      >
                        <Ionicons
                          name={mode === 'ai' ? 'sparkles' : 'headset'}
                          size={13}
                          color={active ? '#FFFFFF' : GUEST_COLORS.muted}
                        />
                        <Text size="xs" bold className={active ? 'font-bevi-bold text-white' : 'font-bevi text-muted'}>
                          {mode === 'ai' ? t('account:messages.modeAi') : t('account:messages.modeHuman')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Composer */}
            <View className="border-t border-hairline/30 bg-surface px-3 pt-2.5 pb-2 flex-row items-end gap-2">
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
        </SafeAreaView>
      )}
    </View>
  );
}
