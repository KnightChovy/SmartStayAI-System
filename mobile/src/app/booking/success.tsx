import { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { QRVoucher } from '@/components/shared/QRVoucher';
import { useGetBooking } from '@/hooks/bookings';
import { useCreateVnpayPayment } from '@/hooks/payments';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';


/** Lấy message lỗi từ axios error mà không dùng `any`. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { bookingId = '' } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, refetch, isRefetching } = useGetBooking(bookingId);
  const createPayment = useCreateVnpayPayment();
  const [payError, setPayError] = useState('');

  async function handlePay() {
    setPayError('');
    try {
      const { paymentUrl } = await createPayment.mutateAsync(bookingId);
      await WebBrowser.openBrowserAsync(paymentUrl);
      // VNPay redirect về web; quay lại app thì refetch để cập nhật trạng thái.
      await refetch();
    } catch (err) {
      setPayError(errorMessage(err, 'Could not start VNPay payment. Please try again later.'));
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
      </View>
    );
  }

  const isPending = booking?.status === 'pending';

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Success hero */}
        <View className="items-center pt-8 pb-6">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center">
            <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
          </View>
          <Heading size="2xl" className="font-bevi-bold text-on-surface mt-4">Booking confirmed!</Heading>
          <Text size="sm" className="font-bevi text-on-surface-variant text-center mt-1.5 px-6">
            {isPending
              ? 'Your room is on hold. Complete payment to secure your stay.'
              : 'A confirmation has been sent to your email. Show the code below at check-in.'}
          </Text>
        </View>

        {/* Booking card */}
        <View className="bg-surface rounded-card p-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text size="xs" className="font-bevi text-muted">Booking code</Text>
              <Text bold className="font-bevi-bold text-on-surface text-2xl tracking-wider">{booking?.bookingCode ?? '—'}</Text>
            </View>
            {booking && <BookingStatusBadge status={booking.status} size="md" />}
          </View>

          {/* Check-in QR */}
          {booking?.bookingCode ? (
            <View className="items-center py-3 border-y border-dashed border-hairline/50 mb-4">
              <QRVoucher data={booking.voucher?.qrData ?? booking.bookingCode} />
              <Text size="2xs" className="font-bevi text-muted mt-2">Scan at the front desk</Text>
            </View>
          ) : null}

          {booking?.hotel && (
            <Row icon="business-outline" text={booking.hotel.name} />
          )}
          {booking?.roomType?.name && (
            <Row icon="bed-outline" text={booking.roomType.name} />
          )}
          <Row
            icon="calendar-outline"
            text={`${formatDateShort(booking?.checkInDate)} → ${formatDateShort(booking?.checkOutDate)}${booking ? ` · ${booking.numNights} night${booking.numNights > 1 ? 's' : ''}` : ''}`}
          />
          <Row icon="people-outline" text={`${booking?.numGuests ?? 0} guest${(booking?.numGuests ?? 0) > 1 ? 's' : ''}`} />

          <View className="flex-row items-center justify-between border-t border-hairline/30 pt-4 mt-2">
            <Text className="font-bevi text-on-surface-variant">Total</Text>
            <Text bold className="font-bevi-bold text-on-surface text-xl">{formatVnd(booking?.totalAmount)}</Text>
          </View>
        </View>

        {payError ? (
          <View className="bg-red-50 rounded-field px-3 py-2.5 mt-3 flex-row items-start gap-2">
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text size="sm" className="font-bevi text-red-600 flex-1">{payError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Actions */}
      <View className="px-4 pt-2 pb-2 gap-3">
        {isPending && (
          <Pressable
            disabled={createPayment.isPending || isRefetching}
            onPress={handlePay}
            className="bg-bronze rounded-card py-3.5 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="card-outline" size={18} color={GUEST_COLORS.onSurface} />
            <Text bold className="font-bevi-bold text-on-surface text-base">
              {createPayment.isPending ? 'Opening VNPay…' : 'Pay now with VNPay'}
            </Text>
          </Pressable>
        )}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.replace({ pathname: '/booking/[id]', params: { id: bookingId } })}
            className="flex-1 border border-hairline/50 rounded-card py-3.5 items-center"
          >
            <Text bold className="font-bevi-bold text-on-surface text-base">View booking</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/(tabs)/bookings')}
            className="flex-1 bg-on-surface rounded-card py-3.5 items-center"
          >
            <Text bold className="font-bevi-bold text-white text-base">My bookings</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View className="flex-row items-center gap-2.5 py-1.5">
      <Ionicons name={icon} size={16} color={GUEST_COLORS.onSurfaceVariant} />
      <Text size="sm" className="font-bevi text-on-surface-variant flex-1">{text}</Text>
    </View>
  );
}
