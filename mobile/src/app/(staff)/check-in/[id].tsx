import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import {
  StaffScreenHeader,
  StaffButton,
  StaffEmptyState,
  Card,
} from '@/components/staff';
import {
  useGetBooking,
  useHotelRooms,
  useCheckIn,
  useStaffHotelId,
} from '@/hooks/staff';
import { formatDateLong } from '@/utils/formatDate';
import { cn } from '@/lib/cn';

export default function StaffCheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const bookingId = id ?? '';

  const { data: booking, isLoading } = useGetBooking(hotelId ?? '', bookingId);
  const { data: roomsPage } = useHotelRooms(hotelId ?? '', { limit: 200 });
  const checkIn = useCheckIn(hotelId ?? '');

  const [voucherCode, setVoucherCode] = useState('');
  const [roomId, setRoomId] = useState<string | undefined>(undefined);

  // Booking đã được gán trước phòng (qua "Room assignment" ở booking detail) → chọn sẵn phòng đó,
  // vì BE cũng ưu tiên bookingRoom đã gán khi payload không kèm roomId.
  const preAssignedRoomId = booking?.bookingRooms?.[0]?.room?.id;
  useEffect(() => {
    if (preAssignedRoomId) setRoomId(preAssignedRoomId);
  }, [preAssignedRoomId]);

  // Available rooms of the booking's type → staff can pick manually (or let BE auto-assign).
  const availableRooms = (roomsPage?.results ?? []).filter(
    (r) => r.roomTypeId === booking?.roomTypeId && r.status === 'available'
  );

  function handleCheckIn() {
    checkIn.mutate(
      {
        bookingId,
        payload: {
          ...(roomId ? { roomId } : {}),
          ...(voucherCode.trim() ? { voucherCode: voucherCode.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Checked in', 'The room has been assigned to the guest.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (e) => {
          const message =
            (e as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Unable to check in. Check the booking status.';
          Alert.alert('Error', message);
        },
      }
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader title="Check in" onBack={() => router.back()} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : !booking ? (
        <StaffEmptyState icon="alert-circle-outline" tone="danger" title="Booking not found" />
      ) : (
        <SafeAreaView className="flex-1" edges={['bottom']}>
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Guest summary */}
            <Card className="p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-2xl bg-staff-50 items-center justify-center">
                  <Text bold className="text-staff-700 text-lg">
                    {(booking.customer?.fullName ?? 'G').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text bold className="text-gray-900 text-base">
                    {booking.customer?.fullName ?? 'Guest'}
                  </Text>
                  <Text size="xs" className="text-gray-400 mt-0.5">
                    #{booking.bookingCode} · {booking.roomType?.name}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1.5 mt-3">
                <Ionicons name="calendar-outline" size={15} color="#0F766E" />
                <Text size="sm" className="text-gray-600">
                  {formatDateLong(booking.checkInDate)} → {formatDateLong(booking.checkOutDate)}
                </Text>
              </View>
            </Card>

            {/* Voucher verify */}
            <Card className="p-4">
              <Text bold className="text-gray-900 mb-2">
                Voucher code (optional)
              </Text>
              <TextInput
                autoCapitalize="characters"
                placeholder={booking.voucher?.voucherCode ?? 'Enter / scan code'}
                placeholderTextColor="#9CA3AF"
                value={voucherCode}
                onChangeText={setVoucherCode}
                className="border border-gray-200 rounded-xl px-3.5 h-11 text-gray-900 text-base"
              />
              <Text size="2xs" className="text-gray-400 mt-1.5">
                Leave blank if you don't need to verify at the desk.
              </Text>
            </Card>

            {/* Room assignment */}
            <Card className="p-4">
              <Text bold className="text-gray-900 mb-1">
                Assign room
              </Text>
              <Text size="2xs" className="text-gray-400 mb-3">
                {preAssignedRoomId
                  ? 'This room was pre-assigned earlier — pick a different one to override it.'
                  : 'Leave empty to auto-assign a free room of the same type.'}
              </Text>
              {availableRooms.length === 0 ? (
                <Text size="sm" className="text-gray-400">
                  No free rooms of this type to pick manually.
                </Text>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {availableRooms.map((r) => {
                    const active = r.id === roomId;
                    return (
                      <Pressable
                        key={r.id}
                        onPress={() => setRoomId(active ? undefined : r.id)}
                        className={cn(
                          'rounded-xl px-4 py-2.5 border',
                          active
                            ? 'bg-staff-700 border-staff-700'
                            : 'bg-white border-gray-200'
                        )}
                      >
                        <Text
                          size="sm"
                          bold={active}
                          className={active ? 'text-white' : 'text-gray-700'}
                        >
                          {r.roomNumber}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Card>
          </ScrollView>

          <View className="border-t border-gray-100 bg-white px-4 pt-3 pb-2">
            <StaffButton
              label="Confirm check-in"
              icon="checkmark-circle-outline"
              loading={checkIn.isPending}
              onPress={handleCheckIn}
            />
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
