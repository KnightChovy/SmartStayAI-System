import { View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { useGetMyBookings } from '@/hooks/bookings';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';

const NAVY = '#0B1D45';

/**
 * Backend chưa có endpoint transaction/payment history riêng — mỗi booking
 * đã là một giao dịch (subtotal → totalAmount qua VNPay), nên dựng lịch sử
 * giao dịch từ chính danh sách booking thật (`GET /bookings/me`).
 */
export default function TransactionsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useGetMyBookings({ limit: 50, sortBy: 'createdAt:desc' });
  const bookings = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </Pressable>
        <Heading size="lg" className="text-navy">Transaction History</Heading>
      </View>

      <View className="flex-1 bg-white">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={NAVY} />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <Ionicons name="cloud-offline-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-center">Couldn't load your transactions.</Text>
            <Pressable onPress={() => refetch()} className="bg-navy rounded-xl px-5 py-2.5">
              <Text bold className="text-white">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(b) => b.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            onRefresh={refetch}
            refreshing={isRefetching}
            ListEmptyComponent={
              <View className="items-center justify-center gap-3 mt-24">
                <Ionicons name="receipt-outline" size={56} color="#D1D5DB" />
                <Text bold className="text-gray-400 text-base">No transactions yet</Text>
                <Text size="sm" className="text-gray-300 text-center">Your booking payments will appear here.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({ pathname: '/booking/[id]', params: { id: item.id } })}
                className="flex-row items-center justify-between bg-white rounded-2xl p-4 border border-gray-100"
              >
                <View className="flex-1 pr-3">
                  <Text bold className="text-navy text-sm" numberOfLines={1}>
                    {item.hotel?.name ?? 'Hotel'}
                  </Text>
                  <Text size="xs" className="text-gray-400 mt-0.5">
                    #{item.bookingCode} · {formatDateShort(item.createdAt)}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text bold className="text-navy text-sm">{formatVnd(item.totalAmount)}</Text>
                  <BookingStatusBadge status={item.status} />
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
