import { View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { useGetMyBookings } from '@/hooks/bookings';
import { formatVnd } from '@/utils/formatCurrency';
import { GUEST_COLORS } from '@/constants/guestTheme';

export default function BookingsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useGetMyBookings();
  const bookings = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      <View className="px-5 pt-4 pb-3 bg-surface border-b border-hairline/30">
        <Heading size="xl" className="font-bevi-bold text-on-surface">My Bookings</Heading>
      </View>

      <View className="flex-1 bg-surface">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={48} color={GUEST_COLORS.hairline} />
          <Text className="font-bevi text-muted text-center">{"Couldn’t load your bookings."}</Text>
          <Pressable onPress={() => refetch()} className="bg-on-surface rounded-field px-5 py-2.5">
            <Text bold className="font-bevi-bold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center justify-center gap-3 mt-24">
              <Ionicons name="calendar-outline" size={56} color={GUEST_COLORS.hairline} />
              <Text bold className="font-bevi-bold text-muted text-base">No bookings yet</Text>
              <Text size="sm" className="font-bevi text-hairline">Your upcoming stays will appear here</Text>
              <Pressable onPress={() => router.push('/(tabs)/search')} className="bg-on-surface rounded-field px-5 py-2.5 mt-2">
                <Text bold className="font-bevi-bold text-white">Find a hotel</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/booking/[id]', params: { id: item.id } })}
                className="bg-surface rounded-card p-4 border border-hairline/30"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 pr-2">
                    <Text bold className="font-bevi-bold text-on-surface text-base" numberOfLines={1}>
                      {item.hotel?.name ?? 'Hotel'}
                    </Text>
                    <Text size="xs" className="font-bevi text-muted mt-0.5">#{item.bookingCode}</Text>
                  </View>
                  <BookingStatusBadge status={item.status} />
                </View>

                {item.roomType?.name && (
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Ionicons name="bed-outline" size={14} color={GUEST_COLORS.onSurfaceVariant} />
                    <Text size="sm" className="font-bevi text-on-surface-variant">{item.roomType.name}</Text>
                  </View>
                )}

                <View className="flex-row items-center gap-1.5 mb-1.5">
                  <Ionicons name="calendar-outline" size={14} color={GUEST_COLORS.onSurfaceVariant} />
                  <Text size="sm" className="font-bevi text-on-surface-variant">
                    {item.checkInDate.slice(0, 10)} → {item.checkOutDate.slice(0, 10)} · {item.numNights} night{item.numNights > 1 ? 's' : ''}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1.5 mb-3">
                  <Ionicons name="people-outline" size={14} color={GUEST_COLORS.onSurfaceVariant} />
                  <Text size="sm" className="font-bevi text-on-surface-variant">{item.numGuests} guest{item.numGuests > 1 ? 's' : ''}</Text>
                </View>

                <View className="flex-row items-center justify-between border-t border-hairline/30 pt-3">
                  <Text size="xs" className="font-bevi text-muted">Total</Text>
                  <View className="flex-row items-center gap-1">
                    <Text bold className="font-bevi-bold text-on-surface text-lg">{formatVnd(item.totalAmount)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={GUEST_COLORS.hairline} />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
      </View>
    </SafeAreaView>
  );
}
