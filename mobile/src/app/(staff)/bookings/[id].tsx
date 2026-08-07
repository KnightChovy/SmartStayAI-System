import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import {
  StaffScreenHeader,
  StaffButton,
  StaffEmptyState,
  Card,
} from '@/components/staff';
import {
  useGetBooking,
  useCheckOut,
  useMarkNoShow,
  useRecordCashPayment,
  useStaffHotelId,
  useHotelRooms,
  useAssignRoom,
  useReleaseAssignedRoom,
} from '@/hooks/staff';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateLong } from '@/utils/formatDate';

/** A single labelled info row with a tinted icon. */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View className="h-9 w-9 rounded-xl bg-staff-50 items-center justify-center">
        <Ionicons name={icon} size={16} color="#0F766E" />
      </View>
      <Text size="sm" className="text-gray-400 w-24">
        {label}
      </Text>
      <Text size="sm" className="text-gray-800 flex-1 text-right" bold>
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text size="xs" bold className="text-gray-400 uppercase tracking-wide mb-1 px-1">
      {children}
    </Text>
  );
}

export default function StaffBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const bookingId = id ?? '';

  const { data: booking, isLoading, isError, refetch } = useGetBooking(
    hotelId ?? '',
    bookingId
  );
  const checkOut = useCheckOut(hotelId ?? '');
  const markNoShow = useMarkNoShow(hotelId ?? '');
  const recordCash = useRecordCashPayment(hotelId ?? '');
  const { data: roomsPage } = useHotelRooms(hotelId ?? '', { limit: 200 });
  const assignRoom = useAssignRoom(hotelId ?? '');
  const releaseRoom = useReleaseAssignedRoom(hotelId ?? '');

  const [extraCharge, setExtraCharge] = useState('');
  const [showRoomPicker, setShowRoomPicker] = useState(false);

  function onError(e: unknown) {
    const message =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Something went wrong. Please try again.';
    Alert.alert('Error', message);
  }

  const assignedRoom = booking?.bookingRooms?.[0]?.room;
  const availableRoomsOfType = (roomsPage?.results ?? []).filter(
    (r) => r.roomTypeId === booking?.roomTypeId && r.status === 'available'
  );

  function handleAssignRoom(roomId: string) {
    assignRoom.mutate(
      { bookingId, payload: { roomId } },
      {
        onSuccess: () => setShowRoomPicker(false),
        onError,
      }
    );
  }

  function handleReleaseRoom() {
    Alert.alert('Release room', 'Unassign the pre-assigned room for this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Release',
        style: 'destructive',
        onPress: () => releaseRoom.mutate(bookingId, { onError }),
      },
    ]);
  }

  function handleCheckOut() {
    const charge = extraCharge ? Number(extraCharge) : undefined;
    checkOut.mutate(
      { bookingId, payload: charge ? { extraCharge: charge } : {} },
      {
        onSuccess: () => Alert.alert('Checked out', 'The invoice has been issued.'),
        onError,
      }
    );
  }

  function handleNoShow() {
    Alert.alert('Confirm no-show', 'Mark this guest as not arrived?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: () => markNoShow.mutate(bookingId, { onError }),
      },
    ]);
  }

  function handleRecordCash() {
    recordCash.mutate(bookingId, {
      onSuccess: () => Alert.alert('Cash recorded', 'The payment has been logged.'),
      onError,
    });
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader title="Booking details" onBack={() => router.back()} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : isError || !booking ? (
        <StaffEmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load booking"
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <SafeAreaView className="flex-1" edges={['bottom']}>
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Guest hero */}
            <Card className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="h-14 w-14 rounded-2xl bg-staff-700 items-center justify-center">
                    <Text bold className="text-white text-xl">
                      {(booking.customer?.fullName ?? 'G').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text bold className="text-gray-900 text-lg" numberOfLines={1}>
                      {booking.customer?.fullName ?? 'Guest'}
                    </Text>
                    <Text size="xs" className="text-gray-400 mt-0.5">
                      #{booking.bookingCode}
                    </Text>
                  </View>
                </View>
                <BookingStatusBadge status={booking.status} size="md" />
              </View>
            </Card>

            {/* Guest contact */}
            <View>
              <SectionTitle>Guest</SectionTitle>
              <Card className="px-4 py-1">
                <InfoRow icon="mail-outline" label="Email" value={booking.customer?.email ?? '—'} />
                <View className="h-px bg-gray-100" />
                <InfoRow icon="call-outline" label="Phone" value={booking.customer?.phone ?? '—'} />
              </Card>
            </View>

            {/* Stay */}
            <View>
              <SectionTitle>Stay</SectionTitle>
              <Card className="px-4 py-1">
                <InfoRow icon="bed-outline" label="Room type" value={booking.roomType?.name ?? '—'} />
                <View className="h-px bg-gray-100" />
                <InfoRow
                  icon="business-outline"
                  label="Room"
                  value={
                    booking.bookingRooms?.length
                      ? booking.bookingRooms
                          .map((br) => br.room?.roomNumber)
                          .filter(Boolean)
                          .join(', ')
                      : 'Not assigned'
                  }
                />
                <View className="h-px bg-gray-100" />
                <InfoRow icon="log-in-outline" label="Check-in" value={formatDateLong(booking.checkInDate)} />
                <View className="h-px bg-gray-100" />
                <InfoRow icon="log-out-outline" label="Check-out" value={formatDateLong(booking.checkOutDate)} />
                <View className="h-px bg-gray-100" />
                <InfoRow
                  icon="people-outline"
                  label="Guests"
                  value={`${booking.numGuests} · ${booking.numNights} night${booking.numNights > 1 ? 's' : ''}`}
                />
              </Card>
            </View>

            {/* Room assignment — chốt trước phòng vật lý cho đơn confirmed */}
            {booking.status === 'confirmed' ? (
              <View>
                <SectionTitle>Room assignment</SectionTitle>
                <Card className="p-4">
                  {assignedRoom ? (
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text size="2xs" className="text-gray-400">
                          Assigned room
                        </Text>
                        <Text bold className="text-gray-900 text-base mt-0.5">
                          {assignedRoom.roomNumber}
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        <StaffButton
                          label="Change"
                          size="sm"
                          variant="outline"
                          onPress={() => setShowRoomPicker((v) => !v)}
                        />
                        <StaffButton
                          label="Release"
                          size="sm"
                          variant="danger"
                          loading={releaseRoom.isPending}
                          onPress={handleReleaseRoom}
                        />
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row items-center justify-between">
                      <Text size="sm" className="text-gray-400 flex-1 pr-2">
                        No room assigned yet. Pick one now so front desk knows it's held.
                      </Text>
                      <StaffButton
                        label="Assign"
                        size="sm"
                        variant="outline"
                        onPress={() => setShowRoomPicker((v) => !v)}
                      />
                    </View>
                  )}

                  {showRoomPicker ? (
                    <View className="mt-3 pt-3 border-t border-gray-100">
                      {availableRoomsOfType.length === 0 ? (
                        <Text size="sm" className="text-gray-400">
                          No free rooms of this type right now.
                        </Text>
                      ) : (
                        <View className="flex-row flex-wrap gap-2">
                          {availableRoomsOfType.map((r) => (
                            <Pressable
                              key={r.id}
                              disabled={assignRoom.isPending}
                              onPress={() => handleAssignRoom(r.id)}
                              className={cn(
                                'rounded-xl px-4 py-2.5 border bg-white border-gray-200',
                                assignRoom.isPending && 'opacity-50'
                              )}
                            >
                              <Text size="sm" className="text-gray-700">
                                {r.roomNumber}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : null}
                </Card>
              </View>
            ) : null}

            {/* Voucher */}
            {booking.voucher ? (
              <View>
                <SectionTitle>E-voucher</SectionTitle>
                <Card className="px-4 py-1">
                  <InfoRow icon="qr-code-outline" label="Code" value={booking.voucher.voucherCode} />
                  <View className="h-px bg-gray-100" />
                  <InfoRow
                    icon="checkmark-circle-outline"
                    label="Used"
                    value={booking.voucher.usedAt ? formatDateLong(booking.voucher.usedAt) : 'No'}
                  />
                </Card>
              </View>
            ) : null}

            {/* Total */}
            <Card flat className="bg-staff-700 p-5 flex-row items-center justify-between border-0">
              <Text bold className="text-teal-50">
                Total amount
              </Text>
              <Text bold className="text-white text-2xl">
                {formatVnd(booking.totalAmount)}
              </Text>
            </Card>

            {/* Extra charge — only while staying */}
            {booking.status === 'checked_in' ? (
              <Card className="p-4">
                <Text bold className="text-gray-900 mb-2">
                  Extra charge (optional)
                </Text>
                <TextInput
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={extraCharge}
                  onChangeText={setExtraCharge}
                  className="border border-gray-200 rounded-xl px-3.5 h-11 text-gray-900 text-base"
                />
              </Card>
            ) : null}
          </ScrollView>

          {/* Action bar */}
          <View className="border-t border-gray-100 bg-white px-4 pt-3 pb-2 gap-2">
            {booking.status === 'confirmed' ? (
              <>
                <StaffButton
                  label="Check in"
                  icon="log-in-outline"
                  onPress={() =>
                    router.push({
                      pathname: '/(staff)/check-in/[id]',
                      params: { id: bookingId },
                    })
                  }
                />
                <View className="flex-row gap-2">
                  <StaffButton
                    label="Cash"
                    variant="subtle"
                    icon="cash-outline"
                    loading={recordCash.isPending}
                    onPress={handleRecordCash}
                    className="flex-1"
                  />
                  <StaffButton
                    label="No-show"
                    variant="danger"
                    icon="close-circle-outline"
                    loading={markNoShow.isPending}
                    onPress={handleNoShow}
                    className="flex-1"
                  />
                </View>
              </>
            ) : booking.status === 'checked_in' ? (
              <StaffButton
                label="Check out & issue invoice"
                icon="log-out-outline"
                loading={checkOut.isPending}
                onPress={handleCheckOut}
              />
            ) : (
              <Text size="sm" className="text-gray-400 text-center py-2">
                No actions for this status.
              </Text>
            )}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
