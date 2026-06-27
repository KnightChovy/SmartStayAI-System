import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRegister, useSendOtp } from '@/hooks/auth';

const NAVY = '#0B1D45';
const GOLD = '#F5A623';
const BORDER = '#E5E7EB';
const BG = '#FFFFFF';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  // Params: email, name, password (khi flow = register)
  const { email = '', name = '', password = '' } = useLocalSearchParams<{
    email: string;
    name: string;
    password: string;
  }>();

  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
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
        onError: (err: any) =>
          Alert.alert('Gửi lại thất bại', err?.response?.data?.message ?? 'Vui lòng thử lại.'),
      },
    );
  }

  function handleVerify() {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Thiếu mã', 'Vui lòng nhập đủ 6 chữ số.');
      return;
    }
    register(
      { name, email, password, verificationCode: code },
      {
        onSuccess: () => router.replace('/(tabs)'),
        onError: (err: any) =>
          Alert.alert('Xác thực thất bại', err?.response?.data?.message ?? 'Mã OTP không đúng, vui lòng thử lại.'),
      },
    );
  }

  const maskedEmail = email
    ? email.replace(/(.{2}).+(@.+)/, (_, a, b) => `${a}****${b}`)
    : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}
        >
          <Text style={{ fontSize: 22, color: NAVY }}>←</Text>
        </Pressable>

        {/* Icon */}
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 34 }}>📬</Text>
        </View>

        <Text style={{ fontSize: 26, fontWeight: '800', color: NAVY, marginBottom: 10 }}>Check your email</Text>
        <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 36 }}>
          We sent a 6-digit verification code to{'\n'}
          <Text style={{ color: NAVY, fontWeight: '600' }}>{maskedEmail}</Text>
        </Text>

        {/* OTP boxes */}
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 36 }}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              style={{
                width: 48,
                height: 56,
                borderWidth: 2,
                borderColor: digit ? NAVY : BORDER,
                borderRadius: 12,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: '700',
                color: NAVY,
                backgroundColor: digit ? '#EFF6FF' : '#F9FAFB',
              }}
              value={digit}
              onChangeText={(v) => handleDigit(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify button */}
        <Pressable
          onPress={handleVerify}
          disabled={isRegistering || digits.join('').length < OTP_LENGTH}
          style={{
            backgroundColor: digits.join('').length < OTP_LENGTH ? '#93A3B8' : NAVY,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          {isRegistering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Verify & Create Account</Text>
          )}
        </Pressable>

        {/* Resend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>Didn't receive the code? </Text>
          {countdown > 0 ? (
            <Text style={{ color: PLACEHOLDER, fontSize: 14, fontWeight: '600' }}>
              Resend in {countdown}s
            </Text>
          ) : (
            <Pressable onPress={handleResend} disabled={isSendingOtp}>
              {isSendingOtp ? (
                <ActivityIndicator size="small" color={GOLD} />
              ) : (
                <Text style={{ color: GOLD, fontWeight: '700', fontSize: 14 }}>Resend</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
