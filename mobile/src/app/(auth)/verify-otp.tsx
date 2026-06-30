import { useRef, useState, useEffect } from 'react';
import { View, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useRegister, useSendOtp } from '@/hooks/auth';

const NAVY = '#0B1D45';
const GOLD = '#F5A623';

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

  const isComplete = digits.join('').length >= OTP_LENGTH;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center mb-8"
        >
          <Text className="text-navy" style={{ fontSize: 22 }}>←</Text>
        </Pressable>

        {/* Icon */}
        <View className="w-[72px] h-[72px] rounded-full bg-blue-50 items-center justify-center mb-6">
          <Text style={{ fontSize: 34 }}>📬</Text>
        </View>

        <Heading size="2xl" className="text-navy mb-2.5">Check your email</Heading>
        <Text size="sm" className="text-gray-500 leading-[22px] mb-9">
          We sent a 6-digit verification code to{'\n'}
          <Text size="sm" bold className="text-navy">{maskedEmail}</Text>
        </Text>

        {/* OTP boxes */}
        <View className="flex-row gap-2.5 justify-center mb-9">
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className="w-12 h-14 border-2 rounded-xl text-center text-navy text-[22px] font-bold"
              style={{
                borderColor: digit ? NAVY : '#E5E7EB',
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
          disabled={isRegistering || !isComplete}
          className={`rounded-2xl py-4 items-center mb-6 ${isComplete ? 'bg-navy' : 'bg-slate-400'}`}
        >
          {isRegistering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text bold className="text-white text-base">Verify & Create Account</Text>
          )}
        </Pressable>

        {/* Resend */}
        <View className="flex-row justify-center items-center">
          <Text size="sm" className="text-gray-500">Didn't receive the code? </Text>
          {countdown > 0 ? (
            <Text size="sm" bold className="text-gray-400">
              Resend in {countdown}s
            </Text>
          ) : (
            <Pressable onPress={handleResend} disabled={isSendingOtp}>
              {isSendingOtp ? (
                <ActivityIndicator size="small" color={GOLD} />
              ) : (
                <Text size="sm" bold className="text-gold">Resend</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
