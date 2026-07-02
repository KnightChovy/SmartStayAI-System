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
import type { BookingStatus } from '@/types/bookings.type';

/** Bộ lọc nhanh theo trạng thái (undefined = tất cả). */
const FILTERS: { label: string; value: BookingStatus | undefined }[] = [
  { label: 'Tất cả', value: undefined },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang ở', value: 'checked_in' },
  { label: 'Đã trả phòng', value: 'checked_out' },
  { label: 'No-show', value: 'no_show' },
];

export default function StaffBookingsScreen() {
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const [status, setStatus] = useState<BookingStatus | undefined>(undefined);

  const { data, isLoading, isError, refetch, isRefetching } = useGetBookings(
    hotelId ?? '',
    { status }
  );
  const bookings = data?.results ?? [];

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
            const active = f.value === status;
            return (
              <Pressable
                key={f.label}
                onPress={() => setStatus(f.value)}
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
