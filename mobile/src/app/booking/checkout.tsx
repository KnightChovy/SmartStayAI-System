import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { PriceSummary } from '@/components/shared/PriceSummary';
import { WalletOption, SepayQrModal } from '@/components/booking';
import { useCreateBooking } from '@/hooks/bookings';
import { useMyWallet } from '@/hooks/wallet';
import { useCreateVnpayPayment, useCreateSepayPayment, usePayWithWallet } from '@/hooks/payments';
import { useAuthStore } from '@/stores/authStore';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateShort, nightsBetween } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';
import { emailError, fullNameError, phoneError } from '@/validations/auth.validation';
import { bookingInputError } from '@/validations/bookings.validation';
import type { SepayPaymentInfo } from '@/types/payments.type';

type PaymentMethod = 'vnpay' | 'sepay';

/** Lấy message lỗi từ axios error mà không dùng `any`. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

export default function BookingCheckoutScreen() {
  const router = useRouter();
  const { t } = useTranslation(['booking', 'common']);
  const STEPS = [t('booking:checkout.steps.details'), t('booking:checkout.steps.review')] as const;
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    hotelId: string; roomTypeId: string; roomName?: string; hotelName?: string;
    checkIn: string; checkOut: string; guests: string; basePrice?: string; totalPrice?: string;
    taxAmount?: string; feeAmount?: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const createBooking = useCreateBooking();
  const { data: wallet } = useMyWallet();
  const payWallet = usePayWithWallet();
  const createVnpay = useCreateVnpayPayment();
  const createSepay = useCreateSepayPayment();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [touched, setTouched] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  // Ví/cổng thanh toán — mirror `BookingCheckoutPage.handleConfirm` phía client.
  const [walletChoice, setWalletChoice] = useState<boolean | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('vnpay');
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [walletCharged, setWalletCharged] = useState(false);
  const [sepayInfo, setSepayInfo] = useState<SepayPaymentInfo | null>(null);
  const walletBalance = Number(wallet?.balanceAvailable ?? 0);

  const guests = Number(params.guests ?? 2);
  const nights = nightsBetween(params.checkIn, params.checkOut);
  // `totalPrice` (khi có) là số CUỐI đã áp pricing rule + thuế/phí — mirror room/[id].tsx.
  // Không có ngày/giá quote ⇒ ước tính thô bằng basePrice × số đêm, không thuế/phí.
  const subtotal = useMemo(() => {
    if (params.totalPrice) return Number(params.totalPrice);
    return Number(params.basePrice ?? 0) * nights;
  }, [params.totalPrice, params.basePrice, nights]);
  const taxAmount = params.taxAmount ? Number(params.taxAmount) : 0;
  const feeAmount = params.feeAmount ? Number(params.feeAmount) : 0;
  // Tiền phòng thuần — trừ thuế/phí ra khỏi tổng để hiện đúng từng dòng.
  const roomCharge = Math.max(subtotal - taxAmount - feeAmount, 0);

  const useWallet = (walletChoice ?? true) && walletBalance > 0;
  const walletApplied = useWallet ? Math.min(walletBalance, subtotal) : 0;
  const remainingToPay = Math.max(subtotal - walletApplied, 0);
  const walletCoversAll = useWallet && remainingToPay <= 0;

  const nameValidation = fullNameError(fullName, t);
  const emailValidation = emailError(email, t);
  const phoneValidation = phoneError(phone, t, true);
  const formValid = !nameValidation && !emailValidation && !phoneValidation;
  const bookingValidation = bookingInputError(
    {
      hotelId: params.hotelId,
      roomTypeId: params.roomTypeId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests,
    },
    t
  );

  function goReview() {
    setTouched(true);
    if (formValid) setStep(1);
  }

  /**
   * Trình tự KHỚP `BookingCheckoutPage.handleConfirm` bên client: tạo booking (một
   * lần, giữ id để bấm lại không tạo trùng) → trừ ví TRƯỚC (nếu chọn) → ví trả hết
   * thì xong luôn, ví trả GHÉP hoặc không dùng ví thì đi tiếp sang cổng đã chọn.
   */
  async function handleConfirm() {
    setSubmissionError('');
    if (bookingValidation) {
      setSubmissionError(bookingValidation);
      return;
    }
    try {
      let bookingId = createdBookingId;
      if (!bookingId) {
        const booking = await createBooking.mutateAsync({
          hotelId: params.hotelId,
          roomTypeId: params.roomTypeId,
          checkInDate: params.checkIn,
          checkOutDate: params.checkOut,
          numGuests: guests,
          specialRequests: specialRequests.trim() || undefined,
        });
        bookingId = booking.id;
        setCreatedBookingId(bookingId);
      }

      if (useWallet && !walletCharged) {
        try {
          const res = await payWallet.mutateAsync(bookingId);
          setWalletCharged(true);
          if (Number(res.remainingToPay) <= 0) {
            router.replace({ pathname: '/booking/success', params: { bookingId } });
            return;
          }
          // Ví trả một phần — đi tiếp xuống cổng đã chọn cho phần còn thiếu.
        } catch (err) {
          setSubmissionError(errorMessage(err, t('booking:payment.payError')));
          return;
        }
      }

      if (payment === 'sepay') {
        const info = await createSepay.mutateAsync(bookingId);
        setSepayInfo(info);
        return;
      }
      const { paymentUrl } = await createVnpay.mutateAsync(bookingId);
      await WebBrowser.openBrowserAsync(paymentUrl);
      router.replace({ pathname: '/booking/success', params: { bookingId } });
    } catch (err) {
      setSubmissionError(errorMessage(err, t('booking:checkout.errorTitle')));
    }
  }

  const confirming =
    createBooking.isPending || payWallet.isPending || createVnpay.isPending || createSepay.isPending;

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} className="bg-surface">
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-hairline/30">
          <Pressable
            onPress={() => (step === 0 ? router.back() : setStep(0))}
            hitSlop={8}
            className="w-9 h-9 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
          </Pressable>
          <Heading size="lg" className="font-bevi-bold text-on-surface">{t('booking:checkout.title')}</Heading>
        </View>
        {/* Stepper */}
        <View className="flex-row items-center px-5 py-3 gap-2">
          {STEPS.map((label, i) => (
            <View key={label} className="flex-1 flex-row items-center gap-2">
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: i <= step ? GUEST_COLORS.onSurface : GUEST_COLORS.hairline }}
              >
                {i < step ? (
                  <Ionicons name="checkmark" size={14} color={GUEST_COLORS.white} />
                ) : (
                  <Text size="2xs" bold className={`font-bevi-bold ${i <= step ? 'text-white' : 'text-muted'}`}>{i + 1}</Text>
                )}
              </View>
              <Text size="xs" bold className={`font-bevi-bold ${i <= step ? 'text-on-surface' : 'text-muted'}`}>{label}</Text>
              {i < STEPS.length - 1 && <View className="flex-1 h-0.5 bg-surface-container" />}
            </View>
          ))}
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}>
          {/* Stay summary card (always visible) */}
          <View className="bg-surface rounded-card p-4 mb-4">
            <Text bold className="font-bevi-bold text-on-surface text-base" numberOfLines={1}>{params.hotelName || t('booking:checkout.yourHotel')}</Text>
            {params.roomName ? <Text size="sm" className="font-bevi text-on-surface-variant mt-0.5">{params.roomName}</Text> : null}
            <View className="flex-row items-center gap-1.5 mt-3">
              <Ionicons name="calendar-outline" size={15} color={GUEST_COLORS.onSurfaceVariant} />
              <Text size="sm" className="font-bevi text-on-surface-variant">
                {formatDateShort(params.checkIn)} → {formatDateShort(params.checkOut)} · {t('common:nights', { count: nights })}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <Ionicons name="people-outline" size={15} color={GUEST_COLORS.onSurfaceVariant} />
              <Text size="sm" className="font-bevi text-on-surface-variant">{t('common:guests', { count: guests })}</Text>
            </View>
          </View>

          {step === 0 ? (
            <>
              <Heading size="md" className="font-bevi-bold text-on-surface mb-3">{t('booking:checkout.steps.details')}</Heading>
              <View className="bg-surface rounded-card p-4 gap-3.5">
                <Field
                  label={t('booking:checkout.fullName')} value={fullName} onChangeText={setFullName}
                  placeholder={t('booking:checkout.fullNamePlaceholder')} error={touched ? nameValidation ?? '' : ''} autoCapitalize="words"
                />
                <Field
                  label={t('booking:checkout.email')} value={email} onChangeText={setEmail}
                  placeholder={t('booking:checkout.emailPlaceholder')} error={touched ? emailValidation ?? '' : ''}
                  keyboardType="email-address" autoCapitalize="none"
                />
                <Field
                  label={t('booking:checkout.phone')} value={phone} onChangeText={setPhone}
                  placeholder={t('booking:checkout.phonePlaceholder')} error={touched ? phoneValidation ?? '' : ''}
                  keyboardType="phone-pad"
                />
                <View>
                  <Text size="sm" bold className="font-bevi-bold text-on-surface mb-1.5">{t('booking:checkout.specialRequests')}</Text>
                  <TextInput
                    value={specialRequests}
                    onChangeText={setSpecialRequests}
                    placeholder={t('booking:checkout.specialRequestsPlaceholder')}
                    placeholderTextColor={GUEST_COLORS.muted}
                    multiline
                    className="border border-hairline/50 rounded-field px-3 py-2.5 text-on-surface text-sm min-h-20"
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <Heading size="md" className="font-bevi-bold text-on-surface mb-3">{t('booking:checkout.steps.review')}</Heading>
              <View className="bg-surface rounded-card p-4 mb-4">
                <ReviewRow label={t('booking:checkout.review.guest')} value={fullName} />
                <ReviewRow label={t('booking:checkout.review.email')} value={email} />
                <ReviewRow label={t('booking:checkout.review.phone')} value={phone} />
                {specialRequests.trim() ? <ReviewRow label={t('booking:checkout.review.requests')} value={specialRequests.trim()} /> : null}
              </View>

              <Heading size="md" className="font-bevi-bold text-on-surface mb-3">{t('booking:checkout.priceDetails')}</Heading>
              <View className="bg-surface rounded-card p-4 mb-4">
                <PriceSummary
                  lines={[
                    { label: `${formatVnd(params.basePrice ?? 0)} × ${t('common:nights', { count: nights })}`, value: roomCharge },
                    ...(taxAmount > 0 ? [{ label: t('booking:detail.tax'), value: taxAmount }] : []),
                    ...(feeAmount > 0 ? [{ label: t('booking:detail.fee'), value: feeAmount }] : []),
                    ...(walletApplied > 0
                      ? [{ label: t('booking:payment.walletMethod'), value: -walletApplied }]
                      : []),
                  ]}
                  total={remainingToPay}
                />
              </View>

              <Heading size="md" className="font-bevi-bold text-on-surface mb-1">{t('booking:payment.title')}</Heading>
              {wallet ? (
                <View className="flex-row items-center gap-1.5 mb-3">
                  <Ionicons name="wallet-outline" size={14} color={GUEST_COLORS.onSurfaceVariant} />
                  <Text size="xs" className="font-bevi text-on-surface-variant">
                    {t('booking:payment.walletBalanceLine', { balance: formatVnd(walletBalance) })}
                  </Text>
                </View>
              ) : null}
              <View className="mb-4 gap-3">
                <WalletOption total={subtotal} choice={walletChoice} onChange={setWalletChoice} />

                {!walletCoversAll && (
                  <View className="flex-row gap-3">
                    <PaymentMethodChip
                      icon="card-outline"
                      label={t('booking:payment.payWithVnpay')}
                      selected={payment === 'vnpay'}
                      onPress={() => setPayment('vnpay')}
                    />
                    <PaymentMethodChip
                      icon="qr-code-outline"
                      label={t('booking:payment.payWithSepay')}
                      selected={payment === 'sepay'}
                      onPress={() => setPayment('sepay')}
                    />
                  </View>
                )}
              </View>

              {submissionError ? (
                <View className="bg-red-50 rounded-field px-3 py-2.5 mb-2 flex-row items-start gap-2">
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text size="sm" className="font-bevi text-red-600 flex-1">{submissionError}</Text>
                </View>
              ) : null}

              <View className="flex-row items-center gap-2 px-1">
                <Ionicons name="lock-closed" size={14} color="#16A34A" />
                <Text size="xs" className="font-bevi text-on-surface-variant flex-1">
                  {t('booking:checkout.holdNote')}
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-surface border-t border-hairline/30 flex-row items-center justify-between px-5 pt-3"
          // Mức sàn 12: `insets.bottom` = 0 trên máy Android dùng nút điều hướng, để trần
          // thì nút Tiếp tục dính sát mép màn hình.
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 12 }}
        >
          <View>
            <Text size="2xs" className="font-bevi text-muted">
              {step === 1 && walletApplied > 0 ? t('booking:payment.dueNow') : t('common:total')}
            </Text>
            <Text bold className="font-bevi-bold text-on-surface text-xl">
              {formatVnd(step === 1 ? remainingToPay : subtotal)}
            </Text>
          </View>
          {step === 0 ? (
            <Pressable onPress={goReview} className="bg-on-surface rounded-card px-7 py-3.5 flex-row items-center gap-1.5">
              <Text bold className="font-bevi-bold text-white text-[15px]">{t('booking:checkout.continue')}</Text>
              <Ionicons name="arrow-forward" size={16} color={GUEST_COLORS.white} />
            </Pressable>
          ) : (
            <Pressable
              disabled={confirming}
              onPress={handleConfirm}
              className="rounded-card px-7 py-3.5"
              style={{ backgroundColor: confirming ? GUEST_COLORS.hairline : GUEST_COLORS.bronze }}
            >
              <Text bold className={`font-bevi-bold ${confirming ? 'text-muted text-[15px]' : 'text-on-surface text-[15px]'}`}>
                {confirming ? t('booking:checkout.creating') : t('booking:checkout.confirm')}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      <SepayQrModal
        visible={!!sepayInfo}
        onClose={() => setSepayInfo(null)}
        bookingId={createdBookingId ?? ''}
        info={sepayInfo}
        onConfirmed={() => {
          setSepayInfo(null);
          if (createdBookingId) {
            router.replace({ pathname: '/booking/success', params: { bookingId: createdBookingId } });
          }
        }}
      />
    </View>
  );
}

function PaymentMethodChip({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border py-3"
      style={{
        borderColor: selected ? GUEST_COLORS.bronze : GUEST_COLORS.hairline,
        backgroundColor: selected ? GUEST_COLORS.bronzeContainer + '33' : 'transparent',
      }}
    >
      <Ionicons name={icon} size={16} color={selected ? GUEST_COLORS.bronze : GUEST_COLORS.onSurfaceVariant} />
      <Text size="sm" bold={selected} className={`font-bevi-bold ${selected ? 'text-on-surface' : 'text-on-surface-variant'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
}

function Field({ label, value, onChangeText, placeholder, error, keyboardType, autoCapitalize }: FieldProps) {
  return (
    <View>
      <Text size="sm" bold className="font-bevi-bold text-on-surface mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={GUEST_COLORS.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className={`border rounded-field px-3 h-11 text-on-surface text-sm ${error ? 'border-red-400' : 'border-hairline/50'}`}
      />
      {error ? <Text size="xs" className="font-bevi text-red-500 mt-1">{error}</Text> : null}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between py-1.5">
      <Text size="sm" className="font-bevi text-on-surface-variant">{label}</Text>
      <Text size="sm" bold className="font-bevi-bold text-on-surface flex-1 text-right ml-4" numberOfLines={2}>{value}</Text>
    </View>
  );
}
