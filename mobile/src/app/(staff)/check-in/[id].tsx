import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import {
  StaffScreenHeader,
  StaffButton,
  StaffEmptyState,
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

  // Phòng trống đúng loại của booking → cho staff chọn tay (không chọn thì BE tự gán).
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
          Alert.alert('Nhận phòng thành công', 'Phòng đã được gán cho khách.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (e) => {
          const message =
            (e as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Không thể nhận phòng. Kiểm tra trạng thái booking.';
          Alert.alert('Lỗi', message);
        },
      }
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <StaffScreenHeader title="Nhận phòng" onBack={() => router.back()} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : !booking ? (
        <StaffEmptyState icon="alert-circle-outline" tone="danger" title="Không tìm thấy booking" />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {/* Tóm tắt khách */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text bold className="text-gray-900 text-lg">
                {booking.customer?.fullName ?? 'Khách'}
              </Text>
              <Text size="xs" className="text-gray-400 mt-0.5">
                #{booking.bookingCode} · {booking.roomType?.name}
              </Text>
              <View className="flex-row items-center gap-1.5 mt-2">
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text size="sm" className="text-gray-600">
                  {formatDateLong(booking.checkInDate)} → {formatDateLong(booking.checkOutDate)}
                </Text>
              </View>
            </View>

            {/* Xác thực voucher */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text bold className="text-staff-800 mb-2">
                Mã voucher (tuỳ chọn)
              </Text>
              <Input>
                <InputField
                  autoCapitalize="characters"
                  placeholder={booking.voucher?.voucherCode ?? 'Nhập / quét mã'}
                  value={voucherCode}
                  onChangeText={setVoucherCode}
                />
              </Input>
              <Text size="2xs" className="text-gray-400 mt-1.5">
                Bỏ trống nếu không cần đối chiếu tại quầy.
              </Text>
            </View>

            {/* Chọn phòng */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text bold className="text-staff-800 mb-1">
                Gán phòng
              </Text>
              <Text size="2xs" className="text-gray-400 mb-3">
                Không chọn → hệ thống tự gán 1 phòng trống cùng loại.
              </Text>
              {availableRooms.length === 0 ? (
                <Text size="sm" className="text-gray-400">
                  Không có phòng trống cùng loại để chọn tay.
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
                          'rounded-xl px-4 py-2 border',
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
            </View>
          </ScrollView>

          <View className="border-t border-gray-100 bg-white px-4 pt-3 pb-2">
            <StaffButton
              label="Xác nhận nhận phòng"
              icon="checkmark-circle-outline"
              loading={checkIn.isPending}
              onPress={handleCheckIn}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
