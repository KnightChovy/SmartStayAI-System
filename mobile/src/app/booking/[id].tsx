import { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { PriceSummary } from '@/components/shared/PriceSummary';
import { QRVoucher } from '@/components/shared/QRVoucher';
import { StayPickerSheet, type StaySelection } from '@/components/shared/StayPickerSheet';
import { PayNowAction, RefundStatusCard } from '@/components/booking';
import { ReviewSheet } from '@/components/guest';
import { useGetBooking, useCancelBooking, usePaymentHold } from '@/hooks/bookings';
import { useMyReviews } from '@/hooks/reviews';
import { formatDateLong, formatDateShort } from '@/utils/formatDate';
import { formatVnd } from '@/utils/formatCurrency';
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
  const { t } = useTranslation(['booking', 'account', 'common']);
  const insets = useSafeAreaInsets();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, isError, refetch, isRefetching } = useGetBooking(id);
  const cancelBooking = useCancelBooking();
  // Đơn quá hạn giữ chỗ nhưng cron chưa quét tới — cần biết ở đây để nói đúng phần ví
  // đang chờ hoàn (`usePaymentHold` là hook, phải gọi vô điều kiện trước early-return).
  const paymentHold = usePaymentHold(booking);
  const [actionError, setActionError] = useState('');
  const [showModifySheet, setShowModifySheet] = useState(false);
  const [modifyRequest, setModifyRequest] = useState<StaySelection | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Đã đánh giá booking này chưa → quyết định "Viết đánh giá" hay "Sửa đánh giá".
  // BE không kèm review vào booking và cũng chưa có `GET /bookings/:id/review`, nên tra
  // trong danh sách đánh giá của mình — đúng cách client đang làm.
  const { data: myReviews } = useMyReviews();
  const existingReview = myReviews?.results.find(r => r.bookingId === id) ?? null;

  const canCancel = booking?.status === 'pending' || booking?.status === 'confirmed';
  const canModify = booking?.status === 'pending' || booking?.status === 'confirmed';
  const canPay = booking?.status === 'pending';
  // BE chỉ cho đánh giá sau khi đã trả phòng (`review.service.ts`: status phải `checked_out`).
  const canReview = booking?.status === 'checked_out';

  function handleApplyModify(selection: StaySelection) {
    setModifyRequest(selection);
    setShowModifySheet(false);
  }

  function handleCancel() {
    Alert.alert(t('booking:detail.cancelTitle'), t('booking:detail.cancelBody'), [
      { text: t('booking:detail.keep'), style: 'cancel' },
      {
        text: t('booking:detail.cancelConfirm'),
        style: 'destructive',
        onPress: async () => {
          setActionError('');
          try {
            await cancelBooking.mutateAsync({ bookingId: id });
          } catch (err) {
            setActionError(errorMessage(err, t('booking:detail.cancelFailed')));
          }
        },
      },
    ]);
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
        <Text className="font-bevi text-muted text-center">{t('booking:detail.error')}</Text>
        <Pressable onPress={() => refetch()} className="bg-on-surface rounded-field px-5 py-2.5">
          <Text bold className="font-bevi-bold text-white">{t('common:retry')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const subtotal = Number(booking.subtotal);
  const discount = Number(booking.discountAmount);
  const tax = Number(booking.taxAmount);
  const fee = Number(booking.feeAmount);
  // Đơn trả GHÉP (ví một phần + cổng phần còn lại) khiến `totalAmount` không còn là số
  // sắp bị thu — luôn đọc `amountPaid`/`remainingAmount` do BE tính sẵn (đã trừ mọi
  // payment `completed`, kể cả `wallet`) thay vì tự cộng lại `payments[]`.
  const paidSoFar = Number(booking.amountPaid);
  const remainingAmount = Number(booking.remainingAmount);

  // Yêu cầu hoàn tiền do BE tự tạo lúc huỷ (theo chính sách của KS) — khách không tự gửi.
  const refunds = (booking.payments ?? []).flatMap(p => p.refunds ?? []);
  const hasPaid = (booking.payments ?? []).some(p => p.status === 'completed');
  /**
   * Ví đã được hệ thống hoàn TỰ ĐỘNG khi job dọn đơn quá hạn giữ chỗ (`releaseExpiredHolds`)
   * hoặc khách tự huỷ đơn chưa xác nhận: payment `wallet` chuyển sang `refunded` và tiền
   * vào thẳng ví, KHÔNG sinh `Refund` nào để `RefundStatusCard` bám vào — phải nói ra
   * riêng, không thì khách chỉ thấy một đơn bị huỷ và không dòng nào nhắc tới khoản đã trừ.
   */
  const walletAutoRefunded =
    booking.status === 'cancelled' && refunds.length === 0
      ? (booking.payments ?? [])
          .filter(p => p.paymentMethod === 'wallet' && p.status === 'refunded')
          .reduce((sum, p) => sum + Number(p.amount), 0)
      : 0;
  /**
   * Phần ví ĐANG chờ được hoàn: đơn quá hạn giữ chỗ nhưng cron `release-holds` (5 phút/lần)
   * chưa quét tới, nên payment ví vẫn `completed`. Nói ra để khách biết tiền sẽ tự về.
   */
  const walletAwaitingRefund = paymentHold.expired
    ? (booking.payments ?? [])
        .filter(p => p.paymentMethod === 'wallet' && p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0)
    : 0;
  // Huỷ muộn bị phạt hết ⇒ BE không tạo refund nào. Phải nói rõ, không để khách chờ tiền.
  const cancelledWithoutRefund =
    booking.status === 'cancelled' && hasPaid && refunds.length === 0;

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} className="bg-surface">
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-hairline/30">
          <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
          </Pressable>
          <Heading size="lg" className="font-bevi-bold text-on-surface">{t('booking:detail.title')}</Heading>
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
              <Text size="xs" className="font-bevi text-muted">{t('booking:detail.bookingCode')}</Text>
              <Text bold className="font-bevi-bold text-on-surface text-xl tracking-wider">{booking.bookingCode}</Text>
            </View>
            <BookingStatusBadge status={booking.status} size="md" />
          </View>
          {booking.cancellationReason ? (
            <Text size="sm" className="font-bevi text-red-600">
              {t('booking:detail.cancellationReason', { reason: booking.cancellationReason })}
            </Text>
          ) : null}

          {booking.status !== 'cancelled' && (
            <View className="items-center pt-4 mt-1 border-t border-dashed border-hairline/50">
              <QRVoucher data={booking.voucher?.qrData ?? booking.bookingCode} label={booking.bookingCode} />
              <Text size="2xs" className="font-bevi text-muted mt-2">{t('booking:detail.showQr')}</Text>
            </View>
          )}
        </View>

        {/* Hotel + room */}
        <View className="bg-surface rounded-card p-4 mb-3.5">
          <Heading size="md" className="font-bevi-bold text-on-surface mb-2">{booking.hotel?.name ?? t('common:hotel')}</Heading>
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
          <InfoRow label={t('booking:detail.info.checkIn')} value={`${formatDateLong(booking.checkInDate)}${booking.hotel?.checkInTime ? ` · ${booking.hotel.checkInTime}` : ''}`} />
          <InfoRow label={t('booking:detail.info.checkOut')} value={`${formatDateLong(booking.checkOutDate)}${booking.hotel?.checkOutTime ? ` · ${booking.hotel.checkOutTime}` : ''}`} />
          <InfoRow label={t('booking:detail.info.nights')} value={t('common:nights', { count: booking.numNights })} />
          <InfoRow label={t('booking:detail.info.guests')} value={t('common:guests', { count: booking.numGuests })} />
          {booking.specialRequests ? <InfoRow label={t('booking:detail.info.requests')} value={booking.specialRequests} /> : null}
        </View>

        {/* Đánh giá — chỉ mở sau khi đã trả phòng, đúng luật của BE. */}
        {canReview && (
          <Pressable
            onPress={() => setShowReview(true)}
            className="mb-3.5 min-h-12 flex-row items-center justify-center gap-2 rounded-card bg-on-surface py-3"
          >
            <Ionicons
              name={existingReview ? 'create-outline' : 'star-outline'}
              size={18}
              color={GUEST_COLORS.white}
            />
            <Text bold className="font-bevi-bold text-white">
              {existingReview ? t('account:reviews.editFeedback') : t('account:reviews.writeReview')}
            </Text>
          </Pressable>
        )}

        {/* Modify reservation (mock — gửi yêu cầu, giống web) */}
        {canModify && (
          <Pressable
            onPress={() => setShowModifySheet(true)}
            className="flex-row items-center justify-center gap-2 border border-hairline/50 rounded-card py-3 mb-3.5 bg-surface"
          >
            <Ionicons name="create-outline" size={18} color={GUEST_COLORS.onSurface} />
            <Text bold className="font-bevi-bold text-on-surface">{t('booking:detail.modify')}</Text>
          </Pressable>
        )}

        {modifyRequest && (
          <View className="bg-emerald-50 rounded-card p-4 mb-3.5 flex-row items-start gap-2.5">
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <View className="flex-1">
              <Text bold className="font-bevi-bold text-emerald-700">{t('booking:detail.modifySent')}</Text>
              <Text size="sm" className="font-bevi text-emerald-700 mt-0.5">
                {t('booking:detail.newDatesPrefix')} {formatDateShort(modifyRequest.checkIn)} → {formatDateShort(modifyRequest.checkOut)} ·{' '}
                {t('common:guests', { count: modifyRequest.guests })}
              </Text>
              <Text size="xs" className="font-bevi text-emerald-600 mt-1">
                {t('booking:detail.modifySentBody')}
              </Text>
            </View>
          </View>
        )}

        {/* Price */}
        <Heading size="md" className="font-bevi-bold text-on-surface mb-2 px-1">{t('booking:detail.priceDetails')}</Heading>
        <View className="bg-surface rounded-card p-4">
          <PriceSummary
            lines={[
              { label: t('booking:detail.roomLine', { count: booking.numNights }), value: subtotal },
              ...(discount > 0 ? [{ label: t('booking:detail.discount'), value: -discount }] : []),
              ...(tax > 0 ? [{ label: t('booking:detail.tax'), value: tax }] : []),
              ...(fee > 0 ? [{ label: t('booking:detail.fee'), value: fee }] : []),
            ]}
            total={booking.totalAmount}
          />
          {paidSoFar > 0 && (
            <View className="mt-3 gap-1.5 border-t border-hairline/30 pt-3">
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

        {/* Theo dõi hoàn tiền — dữ liệu thật từ `booking.payments[].refunds[]` */}
        {refunds.length > 0 && (
          <View className="gap-3 mt-3.5">
            {refunds.map(refund => <RefundStatusCard key={refund.id} refund={refund} />)}
          </View>
        )}

        {/* Quá hạn nhưng cron chưa quét: nút thanh toán đã ẩn ⇒ nếu không có khối này thì
            khách chỉ thấy một đơn "chờ xác nhận" bất động không giải thích gì. */}
        {paymentHold.expired && (
          <View className="flex-row gap-3 bg-amber-50 rounded-card p-4 mt-3.5">
            <Ionicons name="time-outline" size={20} color="#B45309" />
            <View className="flex-1">
              <Text bold className="font-bevi-bold text-on-surface text-sm">{t('booking:detail.holdExpiredTitle')}</Text>
              <Text size="sm" className="font-bevi text-on-surface-variant mt-0.5">
                {walletAwaitingRefund > 0
                  ? t('booking:detail.holdExpiredWallet', { amount: formatVnd(walletAwaitingRefund) })
                  : t('booking:detail.holdExpiredBody')}
              </Text>
            </View>
          </View>
        )}

        {walletAutoRefunded > 0 && (
          <View className="flex-row gap-2.5 bg-emerald-50 rounded-card p-4 mt-3.5">
            <Ionicons name="wallet-outline" size={18} color="#059669" />
            <Text size="sm" className="font-bevi text-on-surface flex-1">
              {t(
                booking.cancelledByRole === 'system'
                  ? 'account:refund.walletAutoRefunded'
                  : 'account:refund.walletRefundedOnCancel',
                { amount: formatVnd(walletAutoRefunded) }
              )}{' '}
              <Text
                bold
                size="sm"
                className="font-bevi-bold text-bronze"
                onPress={() => router.push('/profile/wallet')}
              >
                {t('account:refund.openWallet')}
              </Text>
            </Text>
          </View>
        )}

        {cancelledWithoutRefund && (
          <View className="flex-row gap-2.5 bg-surface-container rounded-card p-4 mt-3.5">
            <Ionicons name="information-circle-outline" size={18} color={GUEST_COLORS.onSurfaceVariant} />
            <Text size="sm" className="font-bevi text-on-surface-variant flex-1">{t('account:refund.noneTitle')}</Text>
          </View>
        )}

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
                {cancelBooking.isPending ? t('booking:detail.cancelling') : t('booking:detail.cancel')}
              </Text>
            </Pressable>
          )}
          {canPay && (
            <PayNowAction booking={booking} onPaid={refetch} />
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

      {canReview && (
        <ReviewSheet
          visible={showReview}
          onClose={() => setShowReview(false)}
          bookingId={booking.id}
          hotelName={booking.hotel?.name ?? t('common:hotel')}
          bookingCode={booking.bookingCode}
          existingReview={existingReview}
        />
      )}
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
