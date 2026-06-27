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
import { useLogin } from '@/hooks/auth';

const NAVY = '#0B1D45';
const GOLD = '#F5A623';
const BORDER = '#E5E7EB';
const PLACEHOLDER = '#9CA3AF';
const BG = '#FFFFFF';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 30 }}>🏨</Text>
            </View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: NAVY }}>SmartStay AI</Text>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#6B7280', marginTop: 4 }}>Welcome back</Text>
          </View>

          {/* Email */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 6 }}>Email</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, backgroundColor: '#F9FAFB' }}>
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

          {/* Password */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 6 }}>Password</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, marginBottom: 8, backgroundColor: '#F9FAFB' }}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>🔒</Text>
            <TextInput
              style={{ flex: 1, height: 50, fontSize: 15, color: NAVY }}
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
            style={{ alignSelf: 'flex-end', marginBottom: 24 }}
          >
            <Text style={{ color: GOLD, fontWeight: '600', fontSize: 14 }}>Forgot password?</Text>
          </Pressable>

          {/* Sign In button */}
          <Pressable
            onPress={handleLogin}
            disabled={isPending}
            style={{ backgroundColor: NAVY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 24 }}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Sign In</Text>
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
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={{ color: GOLD, fontWeight: '700', fontSize: 14 }}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
