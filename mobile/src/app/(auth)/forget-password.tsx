import { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useForgotPassword } from '@/hooks/auth';

const PLACEHOLDER = '#9CA3AF';

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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-4 pb-8">
          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center mb-8"
          >
            <Text size="xl" className="text-navy">←</Text>
          </Pressable>

          {!sent ? (
            <>
              {/* Icon */}
              <View className="w-[72px] h-[72px] rounded-full bg-blue-50 items-center justify-center mb-6">
                <Text size="3xl">🔑</Text>
              </View>

              <Heading size="2xl" className="text-navy mb-2.5">Forgot password?</Heading>
              <Text size="sm" className="text-gray-500 leading-6 mb-8">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </Text>

              {/* Email */}
              <Text size="sm" bold className="text-navy mb-1.5">Email address</Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-3.5 mb-6 bg-gray-50">
                <Text size="lg" className="mr-2.5">✉️</Text>
                <TextInput
                  className="flex-1 h-[50px] text-[15px] text-navy"
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
                className="bg-navy rounded-2xl py-4 items-center mb-5"
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text bold className="text-white text-base">Send reset link</Text>
                )}
              </Pressable>

              {/* Back to login */}
              <Pressable onPress={() => router.back()} className="items-center">
                <Text size="sm" className="text-gray-500">
                  Remember your password?{' '}
                  <Text size="sm" bold className="text-navy">Sign in</Text>
                </Text>
              </Pressable>
            </>
          ) : (
            /* Success state */
            <View className="flex-1 items-center justify-center">
              <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-6">
                <Text size="4xl">📧</Text>
              </View>
              <Heading size="xl" className="text-navy mb-2.5 text-center">Check your email</Heading>
              <Text size="sm" className="text-gray-500 leading-6 text-center mb-8">
                We've sent a password reset link to{'\n'}
                <Text size="sm" className="text-navy font-semibold">{email}</Text>
              </Text>
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                className="bg-navy rounded-2xl py-4 px-12 items-center mb-4"
              >
                <Text bold className="text-white text-base">Back to Sign In</Text>
              </Pressable>
              <Pressable onPress={handleSend}>
                <Text size="sm" className="text-gold font-semibold">Resend email</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
