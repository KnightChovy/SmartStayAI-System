import { View, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useMyConversations } from '@/hooks/messages';
import { formatRelative } from '@/utils/formatDate';
import { getInitials } from '@/utils/hotel';
import type { MyConversationListItem } from '@/types/messages.type';
import { GUEST_COLORS } from '@/constants/guestTheme';

export default function MessagesListScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const { data, isLoading, isError, refetch, isRefetching } = useMyConversations();

  // Chỉ hiện hội thoại gắn với khách sạn (có nhân viên); bỏ trợ lý toàn nền tảng.
  const items = (data ?? []).filter((c): c is MyConversationListItem & { hotel: NonNullable<MyConversationListItem['hotel']> } => c.hotel !== null);

  function openThread(hotelId: string, name: string) {
    router.push({ pathname: '/profile/messages/[hotelId]', params: { hotelId, name } });
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface flex-1">{t('account:messages.title')}</Heading>
        <Pressable
          onPress={() => router.push('/profile/messages/new')}
          hitSlop={8}
          className="w-9 h-9 items-center justify-center rounded-full bg-on-surface"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={GUEST_COLORS.onSurface} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={40} color={GUEST_COLORS.muted} />
          <Text className="font-bevi text-muted text-center mt-3">{t('account:messages.loadError')}</Text>
          <Pressable onPress={() => refetch()} className="mt-4 bg-on-surface rounded-card px-5 py-2.5">
            <Text bold className="font-bevi-bold text-white">{t('common:retry', 'Retry')}</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-surface-low items-center justify-center">
            <Ionicons name="chatbubbles-outline" size={30} color={GUEST_COLORS.muted} />
          </View>
          <Heading size="md" className="font-bevi-bold text-on-surface mt-4">{t('account:messages.empty')}</Heading>
          <Text className="font-bevi text-muted text-center mt-1.5">{t('account:messages.emptyHint')}</Text>
          <Pressable onPress={() => router.push('/profile/messages/new')} className="mt-5 bg-on-surface rounded-card px-5 py-3 flex-row items-center gap-2">
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text bold className="font-bevi-bold text-white">{t('account:messages.startWithHotel')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={GUEST_COLORS.onSurface} />}
        >
          <Text size="sm" className="font-bevi text-muted px-1 mb-2">{t('account:messages.listSubtitle')}</Text>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => openThread(item.hotel.id, item.hotel.name)}
              className="flex-row items-center gap-3 bg-surface rounded-card p-3 mb-2"
            >
              {item.hotel.imageUrl ? (
                <Image source={{ uri: item.hotel.imageUrl }} style={{ width: 52, height: 52, borderRadius: 14 }} contentFit="cover" />
              ) : (
                <View className="w-[52px] h-[52px] rounded-[14px] bg-bronze items-center justify-center">
                  <Text bold className="font-bevi-bold text-on-surface">{getInitials(item.hotel.name)}</Text>
                </View>
              )}
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text bold numberOfLines={1} className="font-bevi-bold text-on-surface flex-1">{item.hotel.name}</Text>
                  {item.lastMessageAt ? <Text size="xs" className="font-bevi text-muted">{formatRelative(item.lastMessageAt)}</Text> : null}
                </View>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  {item.handoff ? <Ionicons name="headset" size={13} color="#059669" /> : null}
                  <Text size="sm" numberOfLines={1} className={`font-bevi flex-1 ${item.handoff ? 'text-green-600' : 'text-muted'}`}>
                    {item.lastMessageSender === 'user' ? `${t('common:you', 'You')}: ` : ''}
                    {item.lastMessage ?? ''}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
