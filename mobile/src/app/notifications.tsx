import { View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useGetMyBookings } from '@/hooks/bookings';
import type { Booking, BookingStatus } from '@/types/bookings.type';
import { GUEST_COLORS } from '@/constants/guestTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface NotificationItem {
  id: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  date: string;
}

/** Icon/màu theo trạng thái — phần thị giác, không phụ thuộc ngôn ngữ. */
const STATUS_VISUAL: Record<BookingStatus, { icon: IconName; iconBg: string; iconColor: string }> = {
  confirmed: { icon: 'checkmark-circle', iconBg: '#DCFCE7', iconColor: '#16A34A' },
  pending: { icon: 'time-outline', iconBg: '#FEF3C7', iconColor: '#B45309' },
  checked_in: { icon: 'enter-outline', iconBg: '#DBEAFE', iconColor: '#1D4ED8' },
  checked_out: { icon: 'star-outline', iconBg: '#FEF9C3', iconColor: '#CA8A04' },
  cancelled: { icon: 'close-circle', iconBg: '#FEE2E2', iconColor: '#DC2626' },
  no_show: { icon: 'alert-circle-outline', iconBg: '#F3F4F6', iconColor: GUEST_COLORS.onSurfaceVariant },
};

/**
 * Sinh thông báo từ booking (dữ liệu thật, không hardcode).
 * Nhận `t` từ component thay vì tự import i18n: dịch phải chạy trong vòng render thì
 * đổi ngôn ngữ mới cập nhật ngay, gọi `i18n.t` ngoài component sẽ đóng băng ngôn ngữ cũ.
 */
function bookingToNotification(b: Booking, t: TFunction<['account', 'common']>): NotificationItem {
  const hotel = b.hotel?.name ?? t('account:notifications.yourHotel');
  const date = b.checkInDate.slice(0, 10);
  return {
    id: b.id,
    date: b.updatedAt.slice(0, 10),
    ...STATUS_VISUAL[b.status],
    title: t(`account:notifications.${b.status}.title`),
    body: t(`account:notifications.${b.status}.body`, { hotel, date }),
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const { data, isLoading, isError, refetch, isRefetching } = useGetMyBookings({ limit: 50 });

  const notifications = (data?.results ?? [])
    .map(b => bookingToNotification(b, t))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">{t('account:notifications.title')}</Heading>
      </View>

      <View className="flex-1 bg-surface">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={48} color={GUEST_COLORS.hairline} />
          <Text className="font-bevi text-muted text-center">{t('account:notifications.error')}</Text>
          <Pressable onPress={() => refetch()} className="bg-on-surface rounded-field px-5 py-2.5">
            <Text bold className="font-bevi-bold text-white">{t('common:retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center justify-center gap-3 mt-24">
              <Ionicons name="notifications-off-outline" size={56} color={GUEST_COLORS.hairline} />
              <Text bold className="font-bevi-bold text-muted text-base">{t('account:notifications.empty')}</Text>
              <Text size="sm" className="font-bevi text-hairline text-center">
                {t('account:notifications.emptyBody')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row items-start gap-3 bg-surface rounded-card p-4 border border-hairline/30">
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: item.iconBg }}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text bold className="font-bevi-bold text-on-surface text-sm flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
                  <Text size="2xs" className="font-bevi text-muted">{item.date}</Text>
                </View>
                <Text size="sm" className="font-bevi text-on-surface-variant mt-0.5 leading-5">{item.body}</Text>
              </View>
            </View>
          )}
        />
      )}
      </View>
    </SafeAreaView>
  );
}
