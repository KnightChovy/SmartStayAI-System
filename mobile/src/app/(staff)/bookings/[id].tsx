import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import {
  StaffScreenHeader,
  StaffButton,
  StaffEmptyState,
} from '@/components/staff';
import {
  useGetBooking,
  useCheckOut,
  useMarkNoShow,
  useRecordCashPayment,
  useStaffHotelId,
} from '@/hooks/staff';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateLong } from '@/utils/formatDate';

/** Một dòng thông tin icon + nhãn + giá trị. */
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
    <View className="flex-row items-center gap-3 py-2">
      <Ionicons name={icon} size={18} color="#0F766E" />
      <Text size="sm" className="text-gray-400 w-24">
        {label}
      </Text>
      <Text size="sm" className="text-gray-800 flex-1" bold>
        {value}
      </Text>
    </View>
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

  const [extraCharge, setExtraCharge] = useState('');

  function onError(e: unknown) {
    const message =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Thao tác thất bại. Vui lòng thử lại.';
    Alert.alert('Lỗi', message);
  }

  function handleCheckOut() {
    const charge = extraCharge ? Number(extraCharge) : undefined;
    checkOut.mutate(
      { bookingId, payload: charge ? { extraCharge: charge } : {} },
      {
        onSuccess: () => Alert.alert('Đã trả phòng', 'Hoá đơn đã được xuất.'),
        onError,
      }
    );
  }

  function handleNoShow() {
    Alert.alert('Xác nhận no-show', 'Đánh dấu khách không đến nhận phòng?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        style: 'destructive',
        onPress: () => markNoShow.mutate(bookingId, { onError }),
      },
    ]);
  }

  function handleRecordCash() {
    recordCash.mutate(bookingId, {
      onSuccess: () => Alert.alert('Đã thu tiền mặt', 'Thanh toán đã được ghi nhận.'),
      onError,
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <StaffScreenHeader
        title="Chi tiết booking"
        onBack={() => router.back()}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : isError || !booking ? (
        <StaffEmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Không tải được booking"
          actionLabel="Thử lại"
          onAction={refetch}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {/* Tiêu đề + trạng thái */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text size="xs" className="text-gray-400">
                  #{booking.bookingCode}
                </Text>
                <BookingStatusBadge status={booking.status} size="md" />
              </View>
              <Text bold className="text-gray-900 text-xl mt-1">
                {booking.customer?.fullName ?? 'Khách'}
              </Text>
            </View>

            {/* Liên hệ khách */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text bold className="text-staff-800 mb-1">
                Khách hàng
              </Text>
              <InfoRow icon="mail-outline" label="Email" value={booking.customer?.email ?? '—'} />
              <InfoRow
                icon="call-outline"
                label="SĐT"
                value={booking.customer?.phone ?? '—'}
              />
            </View>

            {/* Kỳ ở */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text bold className="text-staff-800 mb-1">
                Kỳ lưu trú
              </Text>
              <InfoRow icon="bed-outline" label="Loại phòng" value={booking.roomType?.name ?? '—'} />
              <InfoRow
                icon="business-outline"
                label="Phòng"
                value={
                  booking.bookingRooms?.length
                    ? booking.bookingRooms
                        .map((br) => br.room?.roomNumber)
                        .filter(Boolean)
                        .join(', ')
                    : 'Chưa gán'
                }
              />
              <InfoRow
                icon="log-in-outline"
                label="Nhận phòng"
                value={formatDateLong(booking.checkInDate)}
              />
              <InfoRow
                icon="log-out-outline"
                label="Trả phòng"
                value={formatDateLong(booking.checkOutDate)}
              />
              <InfoRow
                icon="people-outline"
                label="Số khách"
                value={`${booking.numGuests} khách · ${booking.numNights} đêm`}
              />
            </View>

            {/* Voucher */}
            {booking.voucher ? (
              <View className="bg-white rounded-2xl p-4 border border-gray-100">
                <Text bold className="text-staff-800 mb-1">
                  E-voucher
                </Text>
                <InfoRow
                  icon="qr-code-outline"
                  label="Mã"
                  value={booking.voucher.voucherCode}
                />
                <InfoRow
                  icon="checkmark-circle-outline"
                  label="Đã dùng"
                  value={booking.voucher.usedAt ? formatDateLong(booking.voucher.usedAt) : 'Chưa'}
                />
              </View>
            ) : null}

            {/* Tổng tiền */}
            <View className="bg-staff-50 rounded-2xl p-4 flex-row items-center justify-between">
              <Text bold className="text-staff-800">
                Tổng tiền
              </Text>
              <Text bold className="text-staff-800 text-xl">
                {formatVnd(booking.totalAmount)}
              </Text>
            </View>

            {/* Ô phụ thu — chỉ khi đang ở, chuẩn bị trả phòng */}
            {booking.status === 'checked_in' ? (
              <View className="bg-white rounded-2xl p-4 border border-gray-100">
                <Text bold className="text-staff-800 mb-2">
                  Phụ thu khi trả phòng (tuỳ chọn)
                </Text>
                <Input>
                  <InputField
                    keyboardType="numeric"
                    placeholder="0"
                    value={extraCharge}
                    onChangeText={setExtraCharge}
                  />
                </Input>
              </View>
            ) : null}
          </ScrollView>

          {/* Hành động theo trạng thái */}
          <View className="border-t border-gray-100 bg-white px-4 pt-3 pb-2 gap-2">
            {booking.status === 'confirmed' ? (
              <>
                <StaffButton
                  label="Nhận phòng (Check-in)"
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
                    label="Thu tiền mặt"
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
                label="Trả phòng & xuất hoá đơn"
                icon="log-out-outline"
                loading={checkOut.isPending}
                onPress={handleCheckOut}
              />
            ) : (
              <Text size="sm" className="text-gray-400 text-center py-2">
                Không có thao tác cho trạng thái này.
              </Text>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
