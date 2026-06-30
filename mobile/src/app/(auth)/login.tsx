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
import { useLogin } from '@/hooks/auth';

const PLACEHOLDER = '#9CA3AF';

export default function LoginScreen() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    login(
      { email: email.trim(), password },
      {
        onSuccess: () => router.replace('/(tabs)'),
        onError: (err: any) =>
          Alert.alert('Đăng nhập thất bại', err?.response?.data?.message ?? 'Vui lòng thử lại.'),
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
          contentContainerClassName="grow justify-center px-6 py-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-3">
              <Text className="text-3xl">🏨</Text>
            </View>
            <Heading className="text-navy text-2xl font-extrabold">SmartStay AI</Heading>
            <Text className="text-base font-medium text-gray-500 mt-1">Welcome back</Text>
          </View>

          {/* Email */}
          <Text size="sm" bold className="text-navy mb-1.5">Email</Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3.5 mb-4 bg-gray-50">
            <Text className="text-lg mr-2.5">✉️</Text>
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

          {/* Password */}
          <Text size="sm" bold className="text-navy mb-1.5">Password</Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3.5 mb-2 bg-gray-50">
            <Text className="text-lg mr-2.5">🔒</Text>
            <TextInput
              className="flex-1 h-[50px] text-[15px] text-navy"
              placeholder="Enter your password"
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

          {/* Forgot password */}
          <Pressable
            onPress={() => router.push('/(auth)/forget-password')}
            className="self-end mb-6"
          >
            <Text size="sm" bold className="text-gold">Forgot password?</Text>
          </Pressable>

          {/* Sign In button */}
          <Pressable
            onPress={handleLogin}
            disabled={isPending}
            className="bg-navy rounded-2xl py-4 items-center mb-6"
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text bold className="text-white text-base">Sign In</Text>
            )}
          </Pressable>

          {/* Divider */}
          {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
            <Text style={{ marginHorizontal: 12, color: PLACEHOLDER, fontSize: 13 }}>or continue with</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
          </View> */}

          {/* Social buttons */}
          {/* <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
            <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingVertical: 13, backgroundColor: BG }}>
              <Text style={{ fontSize: 18 }}>🇬</Text>
              <Text style={{ fontWeight: '600', color: NAVY, fontSize: 14 }}>Google</Text>
            </Pressable>
            <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingVertical: 13, backgroundColor: BG }}>
              <Text style={{ fontSize: 18 }}>📘</Text>
              <Text style={{ fontWeight: '600', color: NAVY, fontSize: 14 }}>Facebook</Text>
            </Pressable>
          </View> */}

          {/* Sign up */}
          <View className="flex-row justify-center">
            <Text className="text-gray-500 text-sm">Don't have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text bold className="text-gold text-sm">Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
