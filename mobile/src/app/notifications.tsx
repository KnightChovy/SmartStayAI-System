import { View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

/** Sinh thông báo từ một booking dựa trên trạng thái (dữ liệu thật, không hardcode). */
function bookingToNotification(b: Booking): NotificationItem {
  const hotel = b.hotel?.name ?? 'your hotel';
  const checkIn = b.checkInDate.slice(0, 10);
  const base = { id: b.id, date: b.updatedAt.slice(0, 10) };

  const byStatus: Record<BookingStatus, Omit<NotificationItem, 'id' | 'date'>> = {
    confirmed: {
      icon: 'checkmark-circle', iconBg: '#DCFCE7', iconColor: '#16A34A',
      title: 'Booking confirmed', body: `Your stay at ${hotel} is confirmed for ${checkIn}.`,
    },
    pending: {
      icon: 'time-outline', iconBg: '#FEF3C7', iconColor: '#B45309',
      title: 'Booking pending', body: `We're confirming your booking at ${hotel}.`,
    },
    checked_in: {
      icon: 'enter-outline', iconBg: '#DBEAFE', iconColor: '#1D4ED8',
      title: 'Checked in', body: `Welcome to ${hotel}! Enjoy your stay.`,
    },
    checked_out: {
      icon: 'star-outline', iconBg: '#FEF9C3', iconColor: '#CA8A04',
      title: 'How was your stay?', body: `Rate your recent stay at ${hotel}.`,
    },
    cancelled: {
      icon: 'close-circle', iconBg: '#FEE2E2', iconColor: '#DC2626',
      title: 'Booking cancelled', body: `Your booking at ${hotel} was cancelled.`,
    },
    no_show: {
      icon: 'alert-circle-outline', iconBg: '#F3F4F6', iconColor: GUEST_COLORS.onSurfaceVariant,
      title: 'Missed booking', body: `You didn't check in at ${hotel}.`,
    },
  };

  return { ...base, ...byStatus[b.status] };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useGetMyBookings({ limit: 50 });

  const notifications = (data?.results ?? [])
    .map(bookingToNotification)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">Notifications</Heading>
      </View>

      <View className="flex-1 bg-surface">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={48} color={GUEST_COLORS.hairline} />
          <Text className="font-bevi text-muted text-center">Couldn't load notifications.</Text>
          <Pressable onPress={() => refetch()} className="bg-on-surface rounded-field px-5 py-2.5">
            <Text bold className="font-bevi-bold text-white">Retry</Text>
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
              <Text bold className="font-bevi-bold text-muted text-base">No notifications yet</Text>
              <Text size="sm" className="font-bevi text-hairline text-center">
                Updates about your bookings will appear here.
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
