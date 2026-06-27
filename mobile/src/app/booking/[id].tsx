import { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { PriceSummary } from '@/components/shared/PriceSummary';
import { useGetBooking, useCancelBooking } from '@/hooks/bookings';
import { useCreateVnpayPayment } from '@/hooks/payments';
import { formatDateLong } from '@/utils/formatDate';

const NAVY = '#0B1D45';

/** Lấy message lỗi từ axios error mà không dùng `any`. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

export default function BookingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, isError, refetch, isRefetching } = useGetBooking(id);
  const cancelBooking = useCancelBooking();
  const createPayment = useCreateVnpayPayment();
  const [actionError, setActionError] = useState('');

  const canCancel = booking?.status === 'pending' || booking?.status === 'confirmed';
  const canPay = booking?.status === 'pending';

  function handleCancel() {
    Alert.alert('Cancel booking', 'Are you sure you want to cancel this booking? This cannot be undone.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          setActionError('');
          try {
            await cancelBooking.mutateAsync({ bookingId: id });
          } catch (err) {
            setActionError(errorMessage(err, 'Could not cancel this booking. Please try again.'));
          }
        },
      },
    ]);
  }

  async function handlePay() {
    setActionError('');
    try {
      const { paymentUrl } = await createPayment.mutateAsync(id);
      await WebBrowser.openBrowserAsync(paymentUrl);
      await refetch();
    } catch (err) {
      setActionError(errorMessage(err, 'Could not start VNPay payment. Please try again later.'));
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center gap-3 px-8" edges={['top']}>
        <StatusBar style="dark" />
        <Ionicons name="cloud-offline-outline" size={48} color="#D1D5DB" />
        <Text className="text-gray-400 text-center">Couldn’t load this booking.</Text>
        <Pressable onPress={() => refetch()} className="bg-navy rounded-xl px-5 py-2.5">
          <Text bold className="text-white">Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const subtotal = Number(booking.subtotal);
  const discount = Number(booking.discountAmount);

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
          <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </Pressable>
          <Heading size="lg" className="text-navy">Booking details</Heading>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + (canCancel || canPay ? 100 : 24) }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Status + code */}
        <View className="bg-white rounded-2xl p-5 mb-3.5">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text size="xs" className="text-gray-400">Booking code</Text>
              <Text bold className="text-navy text-xl tracking-wider">{booking.bookingCode}</Text>
            </View>
            <BookingStatusBadge status={booking.status} size="md" />
          </View>
          {booking.cancellationReason ? (
            <Text size="sm" className="text-red-600">Reason: {booking.cancellationReason}</Text>
          ) : null}
        </View>

        {/* Hotel + room */}
        <View className="bg-white rounded-2xl p-4 mb-3.5">
          <Heading size="md" className="text-navy mb-2">{booking.hotel?.name ?? 'Hotel'}</Heading>
          {booking.hotel?.address ? (
            <View className="flex-row items-start gap-1.5 mb-2">
              <Ionicons name="location-outline" size={15} color="#6B7280" />
              <Text size="sm" className="text-gray-600 flex-1">{booking.hotel.address}, {booking.hotel.city}</Text>
            </View>
          ) : null}
          {booking.roomType?.name ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="bed-outline" size={15} color="#6B7280" />
              <Text size="sm" className="text-gray-600">{booking.roomType.name}</Text>
            </View>
          ) : null}
        </View>

        {/* Stay info */}
        <View className="bg-white rounded-2xl p-4 mb-3.5">
          <InfoRow label="Check-in" value={`${formatDateLong(booking.checkInDate)}${booking.hotel?.checkInTime ? ` · ${booking.hotel.checkInTime}` : ''}`} />
          <InfoRow label="Check-out" value={`${formatDateLong(booking.checkOutDate)}${booking.hotel?.checkOutTime ? ` · ${booking.hotel.checkOutTime}` : ''}`} />
          <InfoRow label="Nights" value={`${booking.numNights} night${booking.numNights > 1 ? 's' : ''}`} />
          <InfoRow label="Guests" value={`${booking.numGuests} guest${booking.numGuests > 1 ? 's' : ''}`} />
          {booking.specialRequests ? <InfoRow label="Requests" value={booking.specialRequests} /> : null}
        </View>

        {/* Price */}
        <Heading size="md" className="text-navy mb-2 px-1">Price details</Heading>
        <View className="bg-white rounded-2xl p-4">
          <PriceSummary
            lines={[
              { label: `Room × ${booking.numNights} night${booking.numNights > 1 ? 's' : ''}`, value: subtotal },
              ...(discount > 0 ? [{ label: 'Discount', value: -discount }] : []),
            ]}
            total={booking.totalAmount}
          />
        </View>

        {actionError ? (
          <View className="bg-red-50 rounded-xl px-3 py-2.5 mt-3 flex-row items-start gap-2">
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text size="sm" className="text-red-600 flex-1">{actionError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky actions */}
      {(canCancel || canPay) && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex-row gap-3 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {canCancel && (
            <Pressable
              disabled={cancelBooking.isPending}
              onPress={handleCancel}
              className="flex-1 border border-red-200 rounded-2xl py-3.5 items-center"
            >
              <Text bold className="text-red-600 text-base">
                {cancelBooking.isPending ? 'Cancelling…' : 'Cancel'}
              </Text>
            </Pressable>
          )}
          {canPay && (
            <Pressable
              disabled={createPayment.isPending}
              onPress={handlePay}
              className="flex-1 bg-gold rounded-2xl py-3.5 items-center flex-row justify-center gap-2"
            >
              <Ionicons name="card-outline" size={18} color={NAVY} />
              <Text bold className="text-navy text-base">
                {createPayment.isPending ? 'Opening…' : 'Pay now'}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between py-2 border-b border-gray-50">
      <Text size="sm" className="text-gray-500">{label}</Text>
      <Text size="sm" bold className="text-navy flex-1 text-right ml-4">{value}</Text>
    </View>
  );
}
