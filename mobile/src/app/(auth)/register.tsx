import { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useRegister, useSendOtp } from '@/hooks/auth';

const NAVY = '#0B1D45';
const GOLD = '#F5A623';
const PLACEHOLDER = '#9CA3AF';

export default function RegisterScreen() {
  const router = useRouter();
  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  function handleSendOtp() {
    if (!email.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email.');
      return;
    }
    sendOtp(
      { email: email.trim() },
      {
        onSuccess: () => {
          setOtpSent(true);
          Alert.alert('Đã gửi OTP', `Mã xác thực đã được gửi tới ${email.trim()}.`);
        },
        onError: (err: any) =>
          Alert.alert('Gửi OTP thất bại', err?.response?.data?.message ?? 'Vui lòng thử lại.'),
      },
    );
  }

  function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword || !otp.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Mật khẩu xác nhận không đúng.');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Điều khoản', 'Vui lòng đồng ý với điều khoản dịch vụ.');
      return;
    }
    register(
      { name: name.trim(), email: email.trim(), password, verificationCode: otp.trim() },
      {
        onSuccess: () => router.replace('/(tabs)'),
        onError: (err: any) =>
          Alert.alert('Đăng ký thất bại', err?.response?.data?.message ?? 'Vui lòng thử lại.'),
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header row */}
          <View className="flex-row items-center justify-between mb-7">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
            >
              <Text className="text-[22px] text-navy">←</Text>
            </Pressable>
            <View className="w-10 h-10 rounded-full bg-navy items-center justify-center">
              <Text className="text-lg">✨</Text>
            </View>
          </View>

          {/* Title */}
          <Heading className="text-2xl text-navy mb-2">Create an account</Heading>
          <Text size="sm" className="text-gray-500 leading-[22px] mb-7">
            Join SmartStay AI to manage your bookings and preferences seamlessly.
          </Text>

          {/* Full Name */}
          <Text size="sm" bold className="text-navy mb-1.5">Full Name</Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3.5 mb-4 bg-gray-50">
            <Ionicons name="person-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              className="flex-1 h-[50px] text-[15px] text-navy"
              placeholder="John Doe"
              placeholderTextColor={PLACEHOLDER}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Email + Send OTP */}
          <Text size="sm" bold className="text-navy mb-1.5">Email address</Text>
          <View className="flex-row gap-2 mb-4">
            <View className="flex-1 flex-row items-center border border-gray-200 rounded-xl px-3.5 bg-gray-50">
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 h-[50px] text-[15px] text-navy"
                placeholder="name@example.com"
                placeholderTextColor={PLACEHOLDER}
                value={email}
                onChangeText={(v) => { setEmail(v); setOtpSent(false); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Pressable
              onPress={handleSendOtp}
              disabled={isSendingOtp}
              className={`rounded-xl px-3.5 items-center justify-center ${otpSent ? 'bg-green-500' : 'bg-navy'}`}
            >
              {isSendingOtp ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text size="xs" bold className="text-white">{otpSent ? '✓ Sent' : 'Send\nOTP'}</Text>
              )}
            </Pressable>
          </View>

          {/* OTP input — luôn hiển thị */}
          <Text size="sm" bold className="text-navy mb-1.5">Verification Code</Text>
          <View
            className={`flex-row items-center border rounded-xl px-3.5 mb-4 ${otpSent ? 'border-gold bg-amber-50' : 'border-gray-200 bg-gray-50'}`}
          >
            <Ionicons name="key-outline" size={20} color={otpSent ? GOLD : '#9CA3AF'} style={{ marginRight: 10 }} />
            <TextInput
              className="flex-1 h-[50px] text-xl text-navy font-bold tracking-[6px]"
              placeholder="------"
              placeholderTextColor={PLACEHOLDER}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            {otp.length === 6 && (
              <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
            )}
          </View>

          {/* Password */}
          <Text size="sm" bold className="text-navy mb-1.5">Password</Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3.5 mb-4 bg-gray-50">
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              className="flex-1 h-[50px] text-[15px] text-navy"
              placeholder="••••••••"
              placeholderTextColor={PLACEHOLDER}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Confirm Password */}
          <Text size="sm" bold className="text-navy mb-1.5">Confirm Password</Text>
          <View
            className={`flex-row items-center border rounded-xl px-3.5 mb-1 bg-gray-50 ${confirmPassword && confirmPassword !== password ? 'border-red-500' : 'border-gray-200'}`}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              className="flex-1 h-[50px] text-[15px] text-navy"
              placeholder="••••••••"
              placeholderTextColor={PLACEHOLDER}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={8}>
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#9CA3AF" />
            </Pressable>
          </View>
          {confirmPassword !== '' && confirmPassword !== password && (
            <Text size="xs" className="text-red-500 mb-3">Passwords do not match</Text>
          )}
          {confirmPassword !== '' && confirmPassword === password && (
            <Text size="xs" className="text-green-500 mb-3">✓ Passwords match</Text>
          )}
          <View className="mb-2" />

          {/* Terms */}
          <Pressable
            onPress={() => setAgreedToTerms((v) => !v)}
            className="flex-row items-start gap-2.5 mb-6"
          >
            <View
              className={`w-5 h-5 rounded border-2 items-center justify-center mt-0.5 ${agreedToTerms ? 'border-navy bg-navy' : 'border-gray-200 bg-white'}`}
            >
              {agreedToTerms && <Text size="xs" bold className="text-white">✓</Text>}
            </View>
            <Text size="sm" className="flex-1 text-gray-500 leading-5">
              I agree to the{' '}
              <Text size="sm" bold className="text-navy">Terms of Service</Text>
              {' '}and{' '}
              <Text size="sm" bold className="text-navy">Privacy Policy</Text>.
            </Text>
          </Pressable>

          {/* Create account button */}
          <Pressable
            onPress={handleRegister}
            disabled={isRegistering || password !== confirmPassword}
            className={`rounded-2xl py-4 items-center mb-5 ${isRegistering || password !== confirmPassword ? 'bg-slate-400' : 'bg-navy'}`}
          >
            {isRegistering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text bold className="text-white text-base">Create account</Text>
            )}
          </Pressable>

          {/* Login link */}
          <View className="flex-row justify-center">
            <Text size="sm" className="text-gray-500">Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text size="sm" bold className="text-navy">Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
