import { View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useGetMyBookings } from '@/hooks/bookings';
import { formatVnd } from '@/utils/formatCurrency';
import type { BookingStatus } from '@/types/bookings.type';

const STATUS_STYLE: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#B45309' },
  confirmed: { label: 'Confirmed', bg: '#DBEAFE', text: '#1D4ED8' },
  checked_in: { label: 'Checked in', bg: '#DCFCE7', text: '#16A34A' },
  checked_out: { label: 'Completed', bg: '#F3F4F6', text: '#6B7280' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#DC2626' },
  no_show: { label: 'No show', bg: '#F3F4F6', text: '#6B7280' },
};

export default function BookingsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useGetMyBookings();
  const bookings = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
      <View className="px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <Heading size="xl" className="text-navy">My Bookings</Heading>
      </View>

      <View className="flex-1 bg-white">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0B1D45" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-400 text-center">Couldn't load your bookings.</Text>
          <Pressable onPress={() => refetch()} className="bg-navy rounded-xl px-5 py-2.5">
            <Text bold className="text-white">Retry</Text>
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
              <Ionicons name="calendar-outline" size={56} color="#D1D5DB" />
              <Text bold className="text-gray-400 text-base">No bookings yet</Text>
              <Text size="sm" className="text-gray-300">Your upcoming stays will appear here</Text>
              <Pressable onPress={() => router.push('/(tabs)/search')} className="bg-navy rounded-xl px-5 py-2.5 mt-2">
                <Text bold className="text-white">Find a hotel</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const status = STATUS_STYLE[item.status];
            return (
              <View className="bg-white rounded-2xl p-4 border border-gray-100">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 pr-2">
                    <Text bold className="text-navy text-base" numberOfLines={1}>
                      {item.hotel?.name ?? 'Hotel'}
                    </Text>
                    <Text size="xs" className="text-gray-400 mt-0.5">#{item.bookingCode}</Text>
                  </View>
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: status.bg }}>
                    <Text size="2xs" bold style={{ color: status.text }}>{status.label}</Text>
                  </View>
                </View>

                {item.roomType?.name && (
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Ionicons name="bed-outline" size={14} color="#6B7280" />
                    <Text size="sm" className="text-gray-600">{item.roomType.name}</Text>
                  </View>
                )}

                <View className="flex-row items-center gap-1.5 mb-1.5">
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text size="sm" className="text-gray-600">
                    {item.checkInDate.slice(0, 10)} → {item.checkOutDate.slice(0, 10)} · {item.numNights} night{item.numNights > 1 ? 's' : ''}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1.5 mb-3">
                  <Ionicons name="people-outline" size={14} color="#6B7280" />
                  <Text size="sm" className="text-gray-600">{item.numGuests} guest{item.numGuests > 1 ? 's' : ''}</Text>
                </View>

                <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
                  <Text size="xs" className="text-gray-400">Total</Text>
                  <Text bold className="text-navy text-lg">{formatVnd(item.totalAmount)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
      </View>
    </SafeAreaView>
  );
}
