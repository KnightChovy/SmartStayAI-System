import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import {
  StaffScreenHeader,
  StaffEmptyState,
  FilterChips,
  Card,
  StatusPill,
} from '@/components/staff';
import { useHotelRooms, useStaffHotelId } from '@/hooks/staff';
import { ROOM_STATUS_STYLE, STAFF_COLORS } from '@/constants/staffTheme';
import type { RoomStatus } from '@/types/staff.type';
import type { FilterChip } from '@/components/staff/FilterChips';

type FilterValue = RoomStatus | undefined;

const FILTERS: FilterChip[] = [
  { label: 'All', value: undefined },
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Maintenance', value: 'maintenance' },
];

export default function StaffRoomsScreen() {
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const [filter, setFilter] = useState<FilterValue>(undefined);

  const { data, isLoading, isError, refetch, isRefetching } = useHotelRooms(
    hotelId ?? '',
    { limit: 200 },
  );
  const rooms = (data?.results ?? []).filter(
    (r) => !filter || r.status === filter,
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader
        title="Rooms"
        subtitle="Today's status"
        large
        onBack={() => router.back()}
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
          subtitle="This staff account isn't linked to a hotel yet."
        />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : isError ? (
        <StaffEmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load rooms"
          subtitle="Check your connection and try again."
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <StaffEmptyState
              icon="bed-outline"
              title="No rooms"
              subtitle="Nothing matches this filter yet."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(staff)/rooms/[roomId]',
                  params: { roomId: item.id },
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
                      {item.roomNumber}
                    </Text>
                    <Text size="xs" className="text-gray-400 mt-0.5" numberOfLines={1}>
                      {item.roomType?.name}
                      {item.floor != null ? ` · Floor ${item.floor}` : ''}
                    </Text>
                  </View>
                </View>
                <StatusPill style={ROOM_STATUS_STYLE[item.status]} />
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
