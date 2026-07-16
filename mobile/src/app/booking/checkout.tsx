import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { PriceSummary } from '@/components/shared/PriceSummary';
import { useCreateBooking } from '@/hooks/bookings';
import { useAuthStore } from '@/stores/authStore';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateShort, nightsBetween } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lấy message lỗi từ axios error mà không dùng `any`. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

const STEPS = ['Guest details', 'Review'] as const;

export default function BookingCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    hotelId: string; roomTypeId: string; roomName?: string; hotelName?: string;
    checkIn: string; checkOut: string; guests: string; basePrice?: string; totalPrice?: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const createBooking = useCreateBooking();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [touched, setTouched] = useState(false);

  const guests = Number(params.guests ?? 2);
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const subtotal = useMemo(() => {
    if (params.totalPrice) return Number(params.totalPrice);
    return Number(params.basePrice ?? 0) * nights;
  }, [params.totalPrice, params.basePrice, nights]);

  const nameError = !fullName.trim() ? 'Full name is required' : '';
  const emailError = !EMAIL_RE.test(email.trim()) ? 'Enter a valid email' : '';
  const phoneError = phone.trim().length < 8 ? 'Enter a valid phone number' : '';
  const formValid = !nameError && !emailError && !phoneError;

  function goReview() {
    setTouched(true);
    if (formValid) setStep(1);
  }

  async function handleConfirm() {
    try {
      const booking = await createBooking.mutateAsync({
        hotelId: params.hotelId,
        roomTypeId: params.roomTypeId,
        checkInDate: params.checkIn,
        checkOutDate: params.checkOut,
        numGuests: guests,
        specialRequests: specialRequests.trim() || undefined,
      });
      router.replace({ pathname: '/booking/success', params: { bookingId: booking.id } });
    } catch {
      // Lỗi hiển thị qua createBooking.isError ở bước review.
    }
  }

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
          <Heading size="lg" className="font-bevi-bold text-on-surface">Complete booking</Heading>
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
            <Text bold className="font-bevi-bold text-on-surface text-base" numberOfLines={1}>{params.hotelName || 'Your hotel'}</Text>
            {params.roomName ? <Text size="sm" className="font-bevi text-on-surface-variant mt-0.5">{params.roomName}</Text> : null}
            <View className="flex-row items-center gap-1.5 mt-3">
              <Ionicons name="calendar-outline" size={15} color={GUEST_COLORS.onSurfaceVariant} />
              <Text size="sm" className="font-bevi text-on-surface-variant">
                {formatDateShort(params.checkIn)} → {formatDateShort(params.checkOut)} · {nights} night{nights > 1 ? 's' : ''}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <Ionicons name="people-outline" size={15} color={GUEST_COLORS.onSurfaceVariant} />
              <Text size="sm" className="font-bevi text-on-surface-variant">{guests} guest{guests > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {step === 0 ? (
            <>
              <Heading size="md" className="font-bevi-bold text-on-surface mb-3">Guest details</Heading>
              <View className="bg-surface rounded-card p-4 gap-3.5">
                <Field
                  label="Full name" value={fullName} onChangeText={setFullName}
                  placeholder="John Doe" error={touched ? nameError : ''} autoCapitalize="words"
                />
                <Field
                  label="Email" value={email} onChangeText={setEmail}
                  placeholder="you@example.com" error={touched ? emailError : ''}
                  keyboardType="email-address" autoCapitalize="none"
                />
                <Field
                  label="Phone" value={phone} onChangeText={setPhone}
                  placeholder="09xx xxx xxx" error={touched ? phoneError : ''}
                  keyboardType="phone-pad"
                />
                <View>
                  <Text size="sm" bold className="font-bevi-bold text-on-surface mb-1.5">Special requests (optional)</Text>
                  <TextInput
                    value={specialRequests}
                    onChangeText={setSpecialRequests}
                    placeholder="Late check-in, high floor, extra bed…"
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
              <Heading size="md" className="font-bevi-bold text-on-surface mb-3">Review &amp; confirm</Heading>
              <View className="bg-surface rounded-card p-4 mb-4">
                <ReviewRow label="Guest" value={fullName} />
                <ReviewRow label="Email" value={email} />
                <ReviewRow label="Phone" value={phone} />
                {specialRequests.trim() ? <ReviewRow label="Requests" value={specialRequests.trim()} /> : null}
              </View>

              <Heading size="md" className="font-bevi-bold text-on-surface mb-3">Price details</Heading>
              <View className="bg-surface rounded-card p-4 mb-4">
                <PriceSummary
                  lines={[{ label: `${formatVnd(params.basePrice ?? 0)} × ${nights} night${nights > 1 ? 's' : ''}`, value: subtotal }]}
                  total={subtotal}
                />
              </View>

              {createBooking.isError && (
                <View className="bg-red-50 rounded-field px-3 py-2.5 mb-2 flex-row items-start gap-2">
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text size="sm" className="font-bevi text-red-600 flex-1">
                    {errorMessage(createBooking.error, 'Could not create booking. The room may no longer be available for these dates.')}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center gap-2 px-1">
                <Ionicons name="lock-closed" size={14} color="#16A34A" />
                <Text size="xs" className="font-bevi text-on-surface-variant flex-1">
                  We’ll hold your room. You can pay securely after confirming.
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-surface border-t border-hairline/30 flex-row items-center justify-between px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View>
            <Text size="2xs" className="font-bevi text-muted">Total</Text>
            <Text bold className="font-bevi-bold text-on-surface text-xl">{formatVnd(subtotal)}</Text>
          </View>
          {step === 0 ? (
            <Pressable onPress={goReview} className="bg-on-surface rounded-card px-7 py-3.5 flex-row items-center gap-1.5">
              <Text bold className="font-bevi-bold text-white text-[15px]">Continue</Text>
              <Ionicons name="arrow-forward" size={16} color={GUEST_COLORS.white} />
            </Pressable>
          ) : (
            <Pressable
              disabled={createBooking.isPending}
              onPress={handleConfirm}
              className="rounded-card px-7 py-3.5"
              style={{ backgroundColor: createBooking.isPending ? GUEST_COLORS.hairline : GUEST_COLORS.bronze }}
            >
              <Text bold className={`font-bevi-bold ${createBooking.isPending ? 'text-muted text-[15px]' : 'text-on-surface text-[15px]'}`}>
                {createBooking.isPending ? 'Confirming…' : 'Confirm booking'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
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
