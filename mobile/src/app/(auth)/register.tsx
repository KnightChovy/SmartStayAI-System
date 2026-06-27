import { useState } from 'react';
import {
  View,
  Text,
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
import { useRegister, useSendOtp } from '@/hooks/auth';

const NAVY = '#0B1D45';
const GOLD = '#F5A623';
const BORDER = '#E5E7EB';
const PLACEHOLDER = '#9CA3AF';
const BG = '#FFFFFF';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 22, color: NAVY }}>←</Text>
            </Pressable>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>✨</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={{ fontSize: 26, fontWeight: '800', color: NAVY, marginBottom: 8 }}>Create an account</Text>
          <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 28 }}>
            Join SmartStay AI to manage your bookings and preferences seamlessly.
          </Text>

          {/* Full Name */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 6 }}>Full Name</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, backgroundColor: '#F9FAFB' }}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              style={{ flex: 1, height: 50, fontSize: 15, color: NAVY }}
              placeholder="John Doe"
              placeholderTextColor={PLACEHOLDER}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Email + Send OTP */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 6 }}>Email address</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F9FAFB' }}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, height: 50, fontSize: 15, color: NAVY }}
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
              style={{ backgroundColor: otpSent ? '#22C55E' : NAVY, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}
            >
              {isSendingOtp ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{otpSent ? '✓ Sent' : 'Send\nOTP'}</Text>
              )}
            </Pressable>
          </View>

          {/* OTP input — luôn hiển thị */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 6 }}>Verification Code</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', borderWidth: 1,
            borderColor: otpSent ? GOLD : BORDER,
            borderRadius: 12, paddingHorizontal: 14, marginBottom: 16,
            backgroundColor: otpSent ? '#FFFBEB' : '#F9FAFB',
          }}>
            <Ionicons name="key-outline" size={20} color={otpSent ? GOLD : '#9CA3AF'} style={{ marginRight: 10 }} />
            <TextInput
              style={{ flex: 1, height: 50, fontSize: 20, color: NAVY, letterSpacing: 6, fontWeight: '700' }}
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
          <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 6 }}>Password</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, backgroundColor: '#F9FAFB' }}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              style={{ flex: 1, height: 50, fontSize: 15, color: NAVY }}
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
          <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 6 }}>Confirm Password</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', borderWidth: 1,
            borderColor: confirmPassword && confirmPassword !== password ? '#EF4444' : BORDER,
            borderRadius: 12, paddingHorizontal: 14, marginBottom: 4, backgroundColor: '#F9FAFB',
          }}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              style={{ flex: 1, height: 50, fontSize: 15, color: NAVY }}
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
            <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>Passwords do not match</Text>
          )}
          {confirmPassword !== '' && confirmPassword === password && (
            <Text style={{ color: '#22C55E', fontSize: 12, marginBottom: 12 }}>✓ Passwords match</Text>
          )}
          <View style={{ marginBottom: 8 }} />

          {/* Terms */}
          <Pressable
            onPress={() => setAgreedToTerms((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 24 }}
          >
            <View style={{
              width: 20, height: 20, borderRadius: 4, borderWidth: 2,
              borderColor: agreedToTerms ? NAVY : BORDER,
              backgroundColor: agreedToTerms ? NAVY : BG,
              alignItems: 'center', justifyContent: 'center', marginTop: 2,
            }}>
              {agreedToTerms && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
            </View>
            <Text style={{ flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 20 }}>
              I agree to the{' '}
              <Text style={{ color: NAVY, fontWeight: '700' }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: NAVY, fontWeight: '700' }}>Privacy Policy</Text>.
            </Text>
          </Pressable>

          {/* Create account button */}
          <Pressable
            onPress={handleRegister}
            disabled={isRegistering || password !== confirmPassword}
            style={{ backgroundColor: isRegistering || password !== confirmPassword ? '#93A3B8' : NAVY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20 }}
          >
            {isRegistering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Create account</Text>
            )}
          </Pressable>

          {/* Login link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: NAVY, fontWeight: '700', fontSize: 14 }}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
