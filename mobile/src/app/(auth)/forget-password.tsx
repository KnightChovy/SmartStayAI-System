import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForgotPassword } from '@/hooks/auth';

const NAVY = '#0B1D45';
const GOLD = '#F5A623';
const BORDER = '#E5E7EB';
const PLACEHOLDER = '#9CA3AF';
const BG = '#FFFFFF';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!email.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ email.');
      return;
    }
    forgotPassword(
      { email: email.trim() },
      {
        onSuccess: () => setSent(true),
        onError: (err: any) =>
          Alert.alert('Thất bại', err?.response?.data?.message ?? 'Vui lòng thử lại.'),
      },
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}
          >
            <Text style={{ fontSize: 22, color: NAVY }}>←</Text>
          </Pressable>

          {!sent ? (
            <>
              {/* Icon */}
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 34 }}>🔑</Text>
              </View>

              <Text style={{ fontSize: 26, fontWeight: '800', color: NAVY, marginBottom: 10 }}>Forgot password?</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 32 }}>
                No worries! Enter your email address and we'll send you a link to reset your password.
              </Text>

              {/* Email */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 6 }}>Email address</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, marginBottom: 24, backgroundColor: '#F9FAFB' }}>
                <Text style={{ fontSize: 18, marginRight: 10 }}>✉️</Text>
                <TextInput
                  style={{ flex: 1, height: 50, fontSize: 15, color: NAVY }}
                  placeholder="Enter your email"
                  placeholderTextColor={PLACEHOLDER}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Send button */}
              <Pressable
                onPress={handleSend}
                disabled={isPending}
                style={{ backgroundColor: NAVY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20 }}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Send reset link</Text>
                )}
              </Pressable>

              {/* Back to login */}
              <Pressable onPress={() => router.back()} style={{ alignItems: 'center' }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>
                  Remember your password?{' '}
                  <Text style={{ color: NAVY, fontWeight: '700' }}>Sign in</Text>
                </Text>
              </Pressable>
            </>
          ) : (
            /* Success state */
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 40 }}>📧</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: NAVY, marginBottom: 10, textAlign: 'center' }}>Check your email</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, textAlign: 'center', marginBottom: 32 }}>
                We've sent a password reset link to{'\n'}
                <Text style={{ color: NAVY, fontWeight: '600' }}>{email}</Text>
              </Text>
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                style={{ backgroundColor: NAVY, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48, alignItems: 'center', marginBottom: 16 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Back to Sign In</Text>
              </Pressable>
              <Pressable onPress={handleSend}>
                <Text style={{ color: GOLD, fontWeight: '600', fontSize: 14 }}>Resend email</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
