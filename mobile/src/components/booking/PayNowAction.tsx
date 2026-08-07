import { useState } from 'react';
import { Modal, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { SepayQrModal } from '@/components/booking/SepayQrModal';
import { useMyWallet } from '@/hooks/wallet';
import { useCreateVnpayPayment, useCreateSepayPayment, usePayWithWallet } from '@/hooks/payments';
import { usePaymentHold } from '@/hooks/bookings';
import { formatVnd } from '@/utils/formatCurrency';
import { GUEST_COLORS } from '@/constants/guestTheme';
import type { Booking } from '@/types/bookings.type';
import type { SepayPaymentInfo } from '@/types/payments.type';

/**
 * `<Modal>` (sheet chọn phương thức) cần thời gian để chạy xong animation đóng
 * (`animationType="slide"`, ~300ms) trước khi trình bày một modal native KHÁC (trình
 * duyệt VNPay / SePay). Gọi `WebBrowser.openBrowserAsync` ngay trong lượt đóng sheet
 * (2 modal native chồng lượt trình bày) là nguồn treo/crash đã gặp trên thiết bị thật —
 * đợi một nhịp cho sheet đóng hẳn rồi mới trình bày modal tiếp theo.
 */
const SHEET_CLOSE_MS = 350;
function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/** Lấy message lỗi từ axios error mà không dùng `any`. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

interface PayNowActionProps {
  booking: Booking;
  /** Nhãn nút — mặc định "Pay now". */
  label?: string;
  /** Ẩn đồng hồ đếm ngược cạnh nút ở nơi đã có banner riêng nói hạn giữ chỗ. */
  showCountdown?: boolean;
  /** Gọi lại sau khi thanh toán xong (toàn phần hoặc một phần) để refetch booking. */
  onPaid: () => void;
}

/**
 * Nút trả tiền cho booking đã tạo nhưng chưa thanh toán — mirror `PayNowAction` phía
 * client. Bấm mở action sheet chọn Ví / VNPay / SePay; mục Ví chỉ hiện khi số dư > 0
 * và ghi rõ nếu chỉ gánh được MỘT PHẦN. Dùng chung cho `booking/[id]` (đơn đã có sẵn)
 * và `booking/success` (fallback khi checkout chưa trả xong).
 *
 * Tự ẩn khi đơn không còn ở trạng thái chờ tiền HOẶC đã quá hạn giữ chỗ (`usePaymentHold`)
 * — quá hạn thì BE cron `release-holds` sẽ tự huỷ đơn (và hoàn lại phần đã trừ ví nếu có),
 * mời khách bấm vào một nút chắc chắn lỗi là không đúng.
 */
export function PayNowAction({ booking, label, showCountdown = true, onPaid }: PayNowActionProps) {
  const { t } = useTranslation('booking');
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [sepayInfo, setSepayInfo] = useState<SepayPaymentInfo | null>(null);

  const { awaitingPayment, countdown } = usePaymentHold(booking);

  // Chỉ hỏi ví khi đơn thật sự đang chờ tiền — tránh bắn thừa request ở mọi dòng list.
  const { data: wallet } = useMyWallet({ enabled: awaitingPayment });
  const walletBalance = Number(wallet?.balanceAvailable ?? 0);
  const remaining = Number(booking.remainingAmount);
  const walletCoversAll = walletBalance >= remaining;

  const payWallet = usePayWithWallet();
  const createVnpay = useCreateVnpayPayment();
  const createSepay = useCreateSepayPayment();
  const busy = payWallet.isPending || createVnpay.isPending || createSepay.isPending;

  if (!awaitingPayment) return null;

  async function payFromWallet() {
    setError('');
    try {
      const res = await payWallet.mutateAsync(booking.id);
      setOpen(false);
      if (Number(res.remainingToPay) > 0) {
        // Cùng lý do với VNPay/SePay bên dưới: đợi sheet đóng hẳn rồi mới trình bày
        // `Alert` (cũng là một modal native) để tránh chồng lượt trình bày.
        await wait(SHEET_CLOSE_MS);
        Alert.alert(
          t('payment.walletPaidPartialTitle'),
          t('payment.walletPaidPartial', {
            amount: formatVnd(res.walletApplied),
            remaining: formatVnd(res.remainingToPay),
          })
        );
        onPaid();
        return;
      }
      onPaid();
    } catch (err) {
      setError(errorMessage(err, t('payment.payError')));
    }
  }

  async function payWith(method: 'vnpay' | 'sepay') {
    setError('');
    try {
      if (method === 'sepay') {
        const info = await createSepay.mutateAsync(booking.id);
        setOpen(false);
        await wait(SHEET_CLOSE_MS);
        setSepayInfo(info);
        return;
      }
      const { paymentUrl } = await createVnpay.mutateAsync(booking.id);
      setOpen(false);
      await wait(SHEET_CLOSE_MS);
      await WebBrowser.openBrowserAsync(paymentUrl);
      onPaid();
    } catch (err) {
      setError(errorMessage(err, t('payment.payError')));
    }
  }

  return (
    <>
      <View className="flex-1 gap-1.5">
        <Pressable
          disabled={busy}
          onPress={() => setOpen(true)}
          className="bg-bronze rounded-card py-3.5 items-center flex-row justify-center gap-2"
        >
          <Ionicons name="card-outline" size={18} color={GUEST_COLORS.onSurface} />
          <Text bold className="font-bevi-bold text-on-surface text-base">
            {label ?? t('payment.payNow')}
          </Text>
        </Pressable>

        {showCountdown && countdown ? (
          <View className="flex-row items-center justify-center gap-1.5">
            <Ionicons name="time-outline" size={13} color="#B45309" />
            <Text size="xs" bold className="font-bevi-bold text-amber-700">
              {t('payment.holdCountdown', { time: countdown })}
            </Text>
          </View>
        ) : null}
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <Pressable className="flex-1" onPress={() => setOpen(false)} />
          <View className="bg-surface rounded-t-3xl">
            <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-hairline/30">
              <Heading size="lg" className="font-bevi-bold text-on-surface">{t('payment.choosePayment')}</Heading>
              <Pressable onPress={() => setOpen(false)} hitSlop={8} className="w-9 h-9 items-center justify-center">
                <Ionicons name="close" size={22} color={GUEST_COLORS.onSurface} />
              </Pressable>
            </View>

            <View className="px-5 py-3 gap-2">
              {walletBalance > 0 && (
                <PayOption
                  icon="wallet-outline"
                  label={
                    walletCoversAll
                      ? t('payment.payWithWallet', { balance: formatVnd(walletBalance) })
                      : t('payment.payWithWalletPartial', {
                          balance: formatVnd(walletBalance),
                          remaining: formatVnd(remaining - walletBalance),
                        })
                  }
                  disabled={busy}
                  loading={payWallet.isPending}
                  onPress={payFromWallet}
                />
              )}
              <PayOption
                icon="card-outline"
                label={t('payment.payWithVnpay')}
                disabled={busy}
                loading={createVnpay.isPending}
                onPress={() => payWith('vnpay')}
              />
              <PayOption
                icon="qr-code-outline"
                label={t('payment.payWithSepay')}
                disabled={busy}
                loading={createSepay.isPending}
                onPress={() => payWith('sepay')}
              />
            </View>

            {error ? (
              <View className="mx-5 mb-2 bg-red-50 rounded-field px-3 py-2.5 flex-row items-start gap-2">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text size="sm" className="font-bevi text-red-600 flex-1">{error}</Text>
              </View>
            ) : null}

            <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} />
          </View>
        </View>
      </Modal>

      <SepayQrModal
        visible={!!sepayInfo}
        onClose={() => setSepayInfo(null)}
        bookingId={booking.id}
        info={sepayInfo}
        onConfirmed={() => {
          setSepayInfo(null);
          onPaid();
        }}
      />
    </>
  );
}

function PayOption({
  icon,
  label,
  disabled,
  loading,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-hairline/50 px-4 py-3.5"
    >
      {loading ? (
        <ActivityIndicator size="small" color={GUEST_COLORS.onSurface} />
      ) : (
        <Ionicons name={icon} size={20} color={GUEST_COLORS.onSurface} />
      )}
      <Text bold className="font-bevi-bold text-on-surface text-sm flex-1">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={GUEST_COLORS.muted} />
    </Pressable>
  );
}
