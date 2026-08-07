import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import {
  StaffScreenHeader,
  StaffEmptyState,
  Card,
  StatusPill,
} from '@/components/staff';
import {
  useGetBookings,
  useHotelRooms,
  useInventoryCalendar,
  useRoomBlocks,
  useStaffHotelId,
} from '@/hooks/staff';
import {
  applyProvisionalHolds,
  bookingCoversDate,
  buildRoomDayView,
  occupiesInventory,
} from '@/utils/roomDayView';
import { formatDate, shiftDateKey, todayKey } from '@/utils/formatDate';
import { ROOM_DAY_STATE_STYLE, STAFF_COLORS } from '@/constants/staffTheme';
import { cn } from '@/lib/cn';

export default function StaffRoomsScreen() {
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const [date, setDate] = useState(todayKey());
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  const calendar = useInventoryCalendar(hotelId ?? '', date, date);
  const roomsQuery = useHotelRooms(hotelId ?? '', { limit: 200 });
  const blocksQuery = useRoomBlocks(hotelId ?? '');
  // 3 trạng thái CÒN chiếm phòng đêm này — `pending` giữ chỗ vẫn tính (tự lọc quá hạn ở
  // `occupiesInventory`), `cancelled/checked_out/no_show` đã nhả phòng nên không cần xin về.
  const bookingsQuery = useGetBookings(hotelId ?? '', {
    status: ['pending', 'confirmed', 'checked_in'],
    fromDate: date,
    toDate: date,
    limit: 500,
  });

  // BE trả `availableRooms` đã kẹp về 0 — tự tính lại để thấy được overbooking (số âm), đúng
  // cách web đang làm (số này khớp con số thật hiện trên lưới đặt phòng của khách).
  const typeRows = useMemo(
    () =>
      (calendar.data?.results ?? [])
        .map(entry => ({
          ...entry,
          available: entry.totalRooms - entry.bookedRooms,
        }))
        .sort((a, b) => a.roomTypeName.localeCompare(b.roomTypeName)),
    [calendar.data],
  );

  const selectedType = typeRows.find(t => t.roomTypeId === selectedTypeId) ?? null;

  const roomDayEntries = useMemo(() => {
    if (!selectedTypeId) return [];
    const rooms = (roomsQuery.data?.results ?? []).filter(
      r => r.roomTypeId === selectedTypeId,
    );
    const bookings = bookingsQuery.data?.results ?? [];

    const factualEntries = buildRoomDayView({
      rooms,
      blocks: blocksQuery.data ?? [],
      bookings,
      date,
    });

    // Đơn đã đặt cho loại phòng này, còn chiếm đêm nay, nhưng CHƯA được lễ tân gán phòng thật
    // nào — đây chính là phần khiến "Held" gần như không bao giờ hiện nếu bỏ qua: lễ tân hầu như
    // không gán phòng trước khi khách tới, nên hầu hết các đơn `held` là xếp TẠM ở đây, không
    // phải từ `bookingRooms` thật.
    const unassignedBookings = bookings.filter(booking => {
      if (booking.roomTypeId !== selectedTypeId) return false;
      if (!occupiesInventory(booking)) return false;
      if (booking.bookingRooms.length > 0) return false;
      return bookingCoversDate(booking, date);
    });

    const { entries } = applyProvisionalHolds({ entries: factualEntries, bookings: unassignedBookings });

    return [...entries].sort((a, b) =>
      a.room.roomNumber.localeCompare(b.room.roomNumber, undefined, { numeric: true }),
    );
  }, [selectedTypeId, roomsQuery.data, blocksQuery.data, bookingsQuery.data, date]);

  const isToday = date === todayKey();
  const isLoadingTypes = calendar.isLoading;
  const isLoadingRooms = roomsQuery.isLoading || blocksQuery.isLoading || bookingsQuery.isLoading;
  const hasError = calendar.isError || roomsQuery.isError || blocksQuery.isError || bookingsQuery.isError;

  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader
        title="Rooms & inventory"
        subtitle={selectedType ? selectedType.roomTypeName : 'How many rooms are left, by night'}
        large
        onBack={() => router.back()}
      >
        <View className="flex-row items-center justify-between px-5">
          <Pressable
            onPress={() => setDate(d => shiftDateKey(d, -1))}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
          >
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => setDate(todayKey())}
            disabled={isToday}
            className="items-center"
          >
            <Text bold className="text-white text-base">
              {formatDate(date)}
            </Text>
            {!isToday ? (
              <Text size="2xs" className="text-teal-50/90 underline">
                Back to today
              </Text>
            ) : (
              <Text size="2xs" className="text-teal-50/90">
                Today
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setDate(d => shiftDateKey(d, 1))}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
          >
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </StaffScreenHeader>

      {!hotelId ? (
        <StaffEmptyState
          icon="business-outline"
          title="No hotel assigned"
          subtitle="This staff account isn't linked to a hotel yet."
        />
      ) : hasError ? (
        <StaffEmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load inventory"
          subtitle="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => {
            calendar.refetch();
            roomsQuery.refetch();
            blocksQuery.refetch();
            bookingsQuery.refetch();
          }}
        />
      ) : selectedTypeId ? (
        isLoadingRooms ? (
          <View className="flex-1 items-center justify-center">
            <Spinner color={STAFF_COLORS.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={roomDayEntries}
            keyExtractor={entry => entry.room.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Pressable
                onPress={() => setSelectedTypeId(null)}
                className="mb-2 flex-row items-center gap-1.5 self-start"
              >
                <Ionicons name="chevron-back" size={16} color={STAFF_COLORS.primary} />
                <Text bold size="sm" className="text-staff-700">
                  Back to room types
                </Text>
              </Pressable>
            }
            ListEmptyComponent={
              <StaffEmptyState
                icon="bed-outline"
                title="No rooms"
                subtitle="This room type has no physical rooms yet."
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(staff)/rooms/[roomId]',
                    params: { roomId: item.room.id },
                  })
                }
              >
                <Card className="p-4 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <View className="h-11 w-11 rounded-2xl bg-staff-50 items-center justify-center">
                      <Ionicons name="bed-outline" size={18} color={STAFF_COLORS.primary} />
                    </View>
                    <View className="flex-1">
                      <Text bold className="text-gray-900 text-base">
                        {item.room.roomNumber}
                      </Text>
                      <Text size="xs" className="text-gray-400 mt-0.5" numberOfLines={1}>
                        {item.room.floor != null ? `Floor ${item.room.floor}` : 'No floor set'}
                        {(item.state === 'occupied' || item.state === 'held') && item.booking
                          ? ` · ${item.booking.customer.fullName}`
                          : ''}
                        {(item.state === 'maintenance' || item.state === 'out_of_service') && item.block
                          ? ` · ${item.block.reason}`
                          : ''}
                      </Text>
                      {item.state === 'held' && item.holdKind === 'provisional' ? (
                        <Text size="2xs" className="text-sky-600 mt-0.5" numberOfLines={1}>
                          Kept free for this arrival · room not confirmed yet
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <StatusPill style={ROOM_DAY_STATE_STYLE[item.state]} />
                </Card>
              </Pressable>
            )}
          />
        )
      ) : isLoadingTypes ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color={STAFF_COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={typeRows}
          keyExtractor={t => t.roomTypeId}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
          onRefresh={calendar.refetch}
          refreshing={calendar.isRefetching}
          ListEmptyComponent={
            <StaffEmptyState icon="bed-outline" title="No room types" subtitle="Nothing to show yet." />
          }
          renderItem={({ item }) => {
            const soldOut = item.available <= 0;
            return (
              <Pressable onPress={() => setSelectedTypeId(item.roomTypeId)}>
                <Card className="p-4 flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text bold className="text-gray-900 text-base">
                      {item.roomTypeName}
                    </Text>
                    <Text size="xs" className="text-gray-400 mt-0.5">
                      {item.bookedRooms} booked of {item.totalRooms}
                      {item.source === 'derived' ? ' · not committed yet' : ''}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className={cn(
                        'rounded-full px-3 py-1.5',
                        soldOut ? 'bg-rose-50' : 'bg-emerald-50',
                      )}
                    >
                      <Text
                        bold
                        size="sm"
                        className={soldOut ? 'text-rose-700' : 'text-emerald-700'}
                      >
                        {soldOut ? (item.available < 0 ? `${item.available} over` : 'Sold out') : `${item.available} left`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={STAFF_COLORS.gray} />
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
