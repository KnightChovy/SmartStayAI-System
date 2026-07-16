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
import { QRVoucher } from '@/components/shared/QRVoucher';
import { StayPickerSheet, type StaySelection } from '@/components/shared/StayPickerSheet';
import { useGetBooking, useCancelBooking } from '@/hooks/bookings';
import { useCreateVnpayPayment } from '@/hooks/payments';
import { formatDateLong, formatDateShort } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';


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
  const [showModifySheet, setShowModifySheet] = useState(false);
  const [modifyRequest, setModifyRequest] = useState<StaySelection | null>(null);

  const canCancel = booking?.status === 'pending' || booking?.status === 'confirmed';
  const canModify = booking?.status === 'pending' || booking?.status === 'confirmed';
  const canPay = booking?.status === 'pending';

  function handleApplyModify(selection: StaySelection) {
    setModifyRequest(selection);
    setShowModifySheet(false);
  }

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
      <View className="flex-1 bg-canvas items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center gap-3 px-8" edges={['top']}>
        <StatusBar style="dark" />
        <Ionicons name="cloud-offline-outline" size={48} color={GUEST_COLORS.hairline} />
        <Text className="font-bevi text-muted text-center">Couldn’t load this booking.</Text>
        <Pressable onPress={() => refetch()} className="bg-on-surface rounded-field px-5 py-2.5">
          <Text bold className="font-bevi-bold text-white">Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const subtotal = Number(booking.subtotal);
  const discount = Number(booking.discountAmount);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} className="bg-surface">
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-hairline/30">
          <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
          </Pressable>
          <Heading size="lg" className="font-bevi-bold text-on-surface">Booking details</Heading>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + (canCancel || canPay ? 100 : 24) }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Status + code */}
        <View className="bg-surface rounded-card p-5 mb-3.5">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text size="xs" className="font-bevi text-muted">Booking code</Text>
              <Text bold className="font-bevi-bold text-on-surface text-xl tracking-wider">{booking.bookingCode}</Text>
            </View>
            <BookingStatusBadge status={booking.status} size="md" />
          </View>
          {booking.cancellationReason ? (
            <Text size="sm" className="font-bevi text-red-600">Reason: {booking.cancellationReason}</Text>
          ) : null}

          {booking.status !== 'cancelled' && (
            <View className="items-center pt-4 mt-1 border-t border-dashed border-hairline/50">
              <QRVoucher data={booking.voucher?.qrData ?? booking.bookingCode} label={booking.bookingCode} />
              <Text size="2xs" className="font-bevi text-muted mt-2">Show this QR code at check-in</Text>
            </View>
          )}
        </View>

        {/* Hotel + room */}
        <View className="bg-surface rounded-card p-4 mb-3.5">
          <Heading size="md" className="font-bevi-bold text-on-surface mb-2">{booking.hotel?.name ?? 'Hotel'}</Heading>
          {booking.hotel?.address ? (
            <View className="flex-row items-start gap-1.5 mb-2">
              <Ionicons name="location-outline" size={15} color={GUEST_COLORS.onSurfaceVariant} />
              <Text size="sm" className="font-bevi text-on-surface-variant flex-1">{booking.hotel.address}, {booking.hotel.city}</Text>
            </View>
          ) : null}
          {booking.roomType?.name ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="bed-outline" size={15} color={GUEST_COLORS.onSurfaceVariant} />
              <Text size="sm" className="font-bevi text-on-surface-variant">{booking.roomType.name}</Text>
            </View>
          ) : null}
        </View>

        {/* Stay info */}
        <View className="bg-surface rounded-card p-4 mb-3.5">
          <InfoRow label="Check-in" value={`${formatDateLong(booking.checkInDate)}${booking.hotel?.checkInTime ? ` · ${booking.hotel.checkInTime}` : ''}`} />
          <InfoRow label="Check-out" value={`${formatDateLong(booking.checkOutDate)}${booking.hotel?.checkOutTime ? ` · ${booking.hotel.checkOutTime}` : ''}`} />
          <InfoRow label="Nights" value={`${booking.numNights} night${booking.numNights > 1 ? 's' : ''}`} />
          <InfoRow label="Guests" value={`${booking.numGuests} guest${booking.numGuests > 1 ? 's' : ''}`} />
          {booking.specialRequests ? <InfoRow label="Requests" value={booking.specialRequests} /> : null}
        </View>

        {/* Modify reservation (mock — gửi yêu cầu, giống web) */}
        {canModify && (
          <Pressable
            onPress={() => setShowModifySheet(true)}
            className="flex-row items-center justify-center gap-2 border border-hairline/50 rounded-card py-3 mb-3.5 bg-surface"
          >
            <Ionicons name="create-outline" size={18} color={GUEST_COLORS.onSurface} />
            <Text bold className="font-bevi-bold text-on-surface">Modify reservation</Text>
          </Pressable>
        )}

        {modifyRequest && (
          <View className="bg-emerald-50 rounded-card p-4 mb-3.5 flex-row items-start gap-2.5">
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <View className="flex-1">
              <Text bold className="font-bevi-bold text-emerald-700">Modification request sent</Text>
              <Text size="sm" className="font-bevi text-emerald-700 mt-0.5">
                New dates: {formatDateShort(modifyRequest.checkIn)} → {formatDateShort(modifyRequest.checkOut)} ·{' '}
                {modifyRequest.guests} guest{modifyRequest.guests > 1 ? 's' : ''}
              </Text>
              <Text size="xs" className="font-bevi text-emerald-600 mt-1">
                The property will confirm availability shortly.
              </Text>
            </View>
          </View>
        )}

        {/* Price */}
        <Heading size="md" className="font-bevi-bold text-on-surface mb-2 px-1">Price details</Heading>
        <View className="bg-surface rounded-card p-4">
          <PriceSummary
            lines={[
              { label: `Room × ${booking.numNights} night${booking.numNights > 1 ? 's' : ''}`, value: subtotal },
              ...(discount > 0 ? [{ label: 'Discount', value: -discount }] : []),
            ]}
            total={booking.totalAmount}
          />
        </View>

        {actionError ? (
          <View className="bg-red-50 rounded-field px-3 py-2.5 mt-3 flex-row items-start gap-2">
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text size="sm" className="font-bevi text-red-600 flex-1">{actionError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky actions */}
      {(canCancel || canPay) && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-surface border-t border-hairline/30 flex-row gap-3 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {canCancel && (
            <Pressable
              disabled={cancelBooking.isPending}
              onPress={handleCancel}
              className="flex-1 border border-red-200 rounded-card py-3.5 items-center"
            >
              <Text bold className="font-bevi-bold text-red-600 text-base">
                {cancelBooking.isPending ? 'Cancelling…' : 'Cancel'}
              </Text>
            </Pressable>
          )}
          {canPay && (
            <Pressable
              disabled={createPayment.isPending}
              onPress={handlePay}
              className="flex-1 bg-bronze rounded-card py-3.5 items-center flex-row justify-center gap-2"
            >
              <Ionicons name="card-outline" size={18} color={GUEST_COLORS.onSurface} />
              <Text bold className="font-bevi-bold text-on-surface text-base">
                {createPayment.isPending ? 'Opening…' : 'Pay now'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <StayPickerSheet
        visible={showModifySheet}
        initialCheckIn={booking.checkInDate.slice(0, 10)}
        initialCheckOut={booking.checkOutDate.slice(0, 10)}
        initialGuests={booking.numGuests}
        onClose={() => setShowModifySheet(false)}
        onApply={handleApplyModify}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between py-2 border-b border-gray-50">
      <Text size="sm" className="font-bevi text-on-surface-variant">{label}</Text>
      <Text size="sm" bold className="font-bevi-bold text-on-surface flex-1 text-right ml-4">{value}</Text>
    </View>
  );
}
