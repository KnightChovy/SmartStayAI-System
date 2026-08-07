import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { PriceSummary } from '@/components/shared/PriceSummary';
import { QRVoucher } from '@/components/shared/QRVoucher';
import { PayNowAction } from '@/components/booking';
import { useGetBooking } from '@/hooks/bookings';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { t } = useTranslation(['booking', 'common']);
  const { bookingId = '' } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, refetch } = useGetBooking(bookingId);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
      </View>
    );
  }

  const isPending = booking?.status === 'pending';
  // Ví trả GHÉP thì `totalAmount` không còn là số đang chờ thu — luôn đọc
  // `amountPaid`/`remainingAmount` do BE tính sẵn thay vì tự suy.
  const paidSoFar = booking ? Number(booking.amountPaid) : 0;
  const remainingAmount = booking ? Number(booking.remainingAmount) : 0;
  const tax = booking ? Number(booking.taxAmount) : 0;
  const fee = booking ? Number(booking.feeAmount) : 0;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Success hero */}
        <View className="items-center pt-8 pb-6">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center">
            <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
          </View>
          <Heading size="2xl" className="font-bevi-bold text-on-surface mt-4">{t('booking:success.title')}</Heading>
          <Text size="sm" className="font-bevi text-on-surface-variant text-center mt-1.5 px-6">
            {isPending ? t('booking:success.pendingBody') : t('booking:success.confirmedBody')}
          </Text>
        </View>

        {/* Booking card */}
        <View className="bg-surface rounded-card p-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text size="xs" className="font-bevi text-muted">{t('booking:success.bookingCode')}</Text>
              <Text bold className="font-bevi-bold text-on-surface text-2xl tracking-wider">{booking?.bookingCode ?? '—'}</Text>
            </View>
            {booking && <BookingStatusBadge status={booking.status} size="md" />}
          </View>

          {/* Check-in QR */}
          {booking?.bookingCode ? (
            <View className="items-center py-3 border-y border-dashed border-hairline/50 mb-4">
              <QRVoucher data={booking.voucher?.qrData ?? booking.bookingCode} />
              <Text size="2xs" className="font-bevi text-muted mt-2">{t('booking:success.scanAtDesk')}</Text>
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
            text={`${formatDateShort(booking?.checkInDate)} → ${formatDateShort(booking?.checkOutDate)}${booking ? ` · ${t('common:nights', { count: booking.numNights })}` : ''}`}
          />
          <Row icon="people-outline" text={t('common:guests', { count: booking?.numGuests ?? 0 })} />

          {booking && (
            <View className="border-t border-hairline/30 pt-4 mt-2">
              <PriceSummary
                lines={[
                  { label: t('booking:detail.roomLine', { count: booking.numNights }), value: Number(booking.subtotal) },
                  ...(Number(booking.discountAmount) > 0
                    ? [{ label: t('booking:detail.discount'), value: -Number(booking.discountAmount) }]
                    : []),
                  ...(tax > 0 ? [{ label: t('booking:detail.tax'), value: tax }] : []),
                  ...(fee > 0 ? [{ label: t('booking:detail.fee'), value: fee }] : []),
                ]}
                total={booking.totalAmount}
              />
            </View>
          )}
          {paidSoFar > 0 && (
            <View className="mt-2 gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text size="sm" className="font-bevi text-on-surface-variant">{t('booking:detail.amountPaid')}</Text>
                <Text size="sm" bold className="font-bevi-bold text-green-600">-{formatVnd(paidSoFar)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text size="sm" bold className="font-bevi-bold text-on-surface">{t('booking:payment.dueNow')}</Text>
                <Text size="sm" bold className="font-bevi-bold text-on-surface">{formatVnd(remainingAmount)}</Text>
              </View>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Actions */}
      <View className="px-4 pt-2 pb-2 gap-3">
        {isPending && booking && (
          <View className="flex-row">
            <PayNowAction booking={booking} label={t('booking:success.payNow')} onPaid={refetch} />
          </View>
        )}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.replace({ pathname: '/booking/[id]', params: { id: bookingId } })}
            className="flex-1 border border-hairline/50 rounded-card py-3.5 items-center"
          >
            <Text bold className="font-bevi-bold text-on-surface text-base">{t('booking:success.viewBooking')}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/(tabs)/bookings')}
            className="flex-1 bg-on-surface rounded-card py-3.5 items-center"
          >
            <Text bold className="font-bevi-bold text-white text-base">{t('booking:success.myBookings')}</Text>
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
