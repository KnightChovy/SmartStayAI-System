import { useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { AuthScreenLayout } from '@/components/auth';
import { LuxButton } from '@/components/guest';
import { useRegister, useSendOtp } from '@/hooks/auth';
import { AUTH_IMAGES, GUEST_COLORS } from '@/constants/guestTheme';
import { errorMessage } from '@/utils/errorMessage';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  // Params: email, name, password (khi flow = register)
  const {
    email = '',
    name = '',
    password = '',
  } = useLocalSearchParams<{
    email: string;
    name: string;
    password: string;
  }>();

  const { t } = useTranslation('auth');
  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  function handleDigit(value: string, index: number) {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleResend() {
    sendOtp(
      { email },
      {
        onSuccess: () => {
          setCountdown(RESEND_SECONDS);
          setDigits(Array(OTP_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        },
        onError: err => Alert.alert(t('verifyOtp.resendFailedTitle'), errorMessage(err, t('errors.generic'))),
      }
    );
  }

  function handleVerify() {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert(t('verifyOtp.missingTitle'), t('verifyOtp.missingBody'));
      return;
    }
    register(
      { name, email, password, verificationCode: code },
      {
        onSuccess: () => router.replace('/(tabs)'),
        onError: err =>
          Alert.alert(t('verifyOtp.failedTitle'), errorMessage(err, t('verifyOtp.failedBody'))),
      }
    );
  }

  const maskedEmail = email ? email.replace(/(.{2}).+(@.+)/, (_, a, b) => `${a}****${b}`) : '';
  const isComplete = digits.join('').length >= OTP_LENGTH;

  return (
    <AuthScreenLayout
      image={AUTH_IMAGES.verifyOtp}
      tagline={t('verifyOtp.tagline')}
      onBack={() => router.back()}
      heroHeight={250}
    >
      <Heading className="font-bevi-bold text-on-surface" size="2xl">
        {t('verifyOtp.title')}
      </Heading>
      <Text className="mb-7 mt-1 font-bevi text-on-surface-variant" size="sm">
        {t('verifyOtp.subtitle')}{'\n'}
        <Text className="font-bevi-semibold text-on-surface" size="sm">
          {maskedEmail}
        </Text>
      </Text>

      <View className="mb-8 flex-row justify-center gap-2.5">
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={el => {
              inputRefs.current[i] = el;
            }}
            className="h-14 w-12 rounded-field border text-center font-bevi-bold text-[22px] text-on-surface"
            // Ô đã điền thì viền + nền đậm lên để thấy ngay còn thiếu ô nào.
            style={{
              borderColor: digit ? GUEST_COLORS.onSurface : GUEST_COLORS.hairline,
              backgroundColor: digit ? GUEST_COLORS.surfaceLowest : GUEST_COLORS.surfaceLow,
            }}
            value={digit}
            onChangeText={v => handleDigit(v, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <LuxButton
        label={t('verifyOtp.submit')}
        onPress={handleVerify}
        loading={isRegistering}
        disabled={!isComplete}
      />

      <View className="mt-7 flex-row items-center justify-center">
        <Text className="font-bevi text-on-surface-variant" size="sm">
          {t('verifyOtp.noCode')}{' '}
        </Text>
        {countdown > 0 ? (
          <Text className="font-bevi-semibold text-muted" size="sm">
            {t('verifyOtp.resendIn', { seconds: countdown })}
          </Text>
        ) : (
          <Pressable onPress={handleResend} disabled={isSendingOtp} hitSlop={8}>
            {isSendingOtp ? (
              <ActivityIndicator size="small" color={GUEST_COLORS.bronze} />
            ) : (
              <Text className="font-bevi-bold text-bronze underline" size="sm">
                {t('verifyOtp.resend')}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </AuthScreenLayout>
  );
}
