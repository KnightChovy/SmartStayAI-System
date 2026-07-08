import { useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import {
  StaffScreenHeader,
  StaffBookingCard,
  StaffEmptyState,
} from '@/components/staff';
import { useGetBookings, useStaffHotelId } from '@/hooks/staff';
import { cn } from '@/lib/cn';
import { toDateKey, todayKey } from '@/utils/formatDate';
import type { BookingStatus } from '@/types/bookings.type';

/** Bộ lọc nhanh; `'checkout_today'` là bộ lọc client-side riêng (phòng cần trả hôm nay). */
type FilterValue = BookingStatus | 'checkout_today' | undefined;

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'Tất cả', value: undefined },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang ở', value: 'checked_in' },
  { label: 'Trả phòng hôm nay', value: 'checkout_today' },
  { label: 'Đã trả phòng', value: 'checked_out' },
  { label: 'No-show', value: 'no_show' },
];

export default function StaffBookingsScreen() {
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const [filter, setFilter] = useState<FilterValue>(undefined);

  // "Trả phòng hôm nay" chỉ có thể là booking đang ở → lọc theo checked_in rồi
  // tự lọc tiếp checkOutDate = hôm nay (BE không có filter theo checkOutDate).
  const status = filter === 'checkout_today' ? 'checked_in' : filter;
  const { data, isLoading, isError, refetch, isRefetching } = useGetBookings(
    hotelId ?? '',
    { status }
  );
  const bookings =
    filter === 'checkout_today'
      ? (data?.results ?? []).filter((b) => toDateKey(b.checkOutDate) === todayKey())
      : (data?.results ?? []);

  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader title="Đặt phòng" subtitle="Vận hành check-in / check-out" />

      {/* Filter chips */}
      <View className="bg-staff-800 pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {FILTERS.map((f) => {
            const active = f.value === filter;
            return (
              <Pressable
                key={f.label}
                onPress={() => setFilter(f.value)}
                className={cn(
                  'rounded-full px-4 py-1.5 border',
                  active ? 'bg-white border-white' : 'border-white/30'
                )}
              >
                <Text
                  size="sm"
                  bold={active}
                  className={active ? 'text-staff-800' : 'text-white'}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {!hotelId ? (
        <StaffEmptyState
          icon="business-outline"
          title="Chưa gán khách sạn"
          subtitle="Tài khoản staff chưa được liên kết với khách sạn nào. Liên hệ quản lý hoặc cấu hình EXPO_PUBLIC_STAFF_HOTEL_ID để thử nghiệm."
        />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : isError ? (
        <StaffEmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Không tải được danh sách"
          subtitle="Kiểm tra kết nối rồi thử lại."
          actionLabel="Thử lại"
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <StaffEmptyState
              icon="calendar-outline"
              title="Không có booking"
              subtitle="Chưa có đặt phòng nào ở bộ lọc này."
            />
          }
          renderItem={({ item }) => (
            <StaffBookingCard
              booking={item}
              onPress={() =>
                router.push({
                  pathname: '/(staff)/bookings/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}
