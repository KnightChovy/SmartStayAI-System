import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import {
  StaffScreenHeader,
  StaffBookingCard,
  StaffEmptyState,
  FilterChips,
} from '@/components/staff';
import { useGetBookings, useStaffHotelId } from '@/hooks/staff';
import { toDateKey, todayKey } from '@/utils/formatDate';
import type { BookingStatus } from '@/types/bookings.type';
import type { FilterChip } from '@/components/staff/FilterChips';

/** Chip value = booking status, or the synthetic "checkout_today" bucket. */
type FilterValue = BookingStatus | 'checkout_today' | undefined;

const FILTERS: FilterChip[] = [
  { label: 'All', value: undefined },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Staying', value: 'checked_in' },
  { label: 'Checkout today', value: 'checkout_today' },
  { label: 'Completed', value: 'checked_out' },
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
    { status },
  );
  const bookings =
    filter === 'checkout_today'
      ? (data?.results ?? []).filter(
          (b) => toDateKey(b.checkOutDate) === todayKey(),
        )
      : (data?.results ?? []);

  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader
        title="Bookings"
        subtitle="Front desk operations"
        large
      >
        <FilterChips
          options={FILTERS}
          value={filter}
          onChange={(v) => setFilter(v as FilterValue)}
        />
      </StaffScreenHeader>

      {!hotelId ? (
        <StaffEmptyState
          icon="business-outline"
          title="No hotel assigned"
          subtitle="This staff account isn't linked to a hotel yet. Contact your manager or set EXPO_PUBLIC_STAFF_HOTEL_ID to test."
        />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : isError ? (
        <StaffEmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load bookings"
          subtitle="Check your connection and try again."
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <StaffEmptyState
              icon="calendar-outline"
              title="No bookings"
              subtitle="Nothing matches this filter yet."
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
