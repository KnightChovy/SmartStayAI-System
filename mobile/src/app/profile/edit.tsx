import { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useUpdateProfile } from '@/hooks/users';
import { useAuthStore } from '@/stores/authStore';
import { getInitials } from '@/utils/hotel';
import type { UpdateProfilePayload } from '@/types/users.type';
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

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState('');

  const nameError = !name.trim() ? 'Name is required' : '';
  const emailError = !EMAIL_RE.test(email.trim()) ? 'Enter a valid email' : '';
  const passwordError = password.length > 0 && password.length < 8 ? 'Password must be at least 8 characters' : '';
  const valid = !nameError && !emailError && !passwordError;

  async function handleSave() {
    setTouched(true);
    setFormError('');
    if (!valid) return;

    // Chỉ gửi field thực sự thay đổi (backend yêu cầu tối thiểu 1 field).
    const payload: UpdateProfilePayload = {};
    if (name.trim() !== user?.fullName) payload.name = name.trim();
    if (email.trim() !== user?.email) payload.email = email.trim();
    if (password.length >= 8) payload.password = password;

    if (Object.keys(payload).length === 0) {
      router.back();
      return;
    }

    try {
      await updateProfile.mutateAsync(payload);
      Alert.alert('Profile updated', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setFormError(errorMessage(err, 'Could not update your profile. Please try again.'));
    }
  }

  const initials = getInitials(name || user?.fullName);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} className="bg-surface">
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-hairline/30">
          <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
          </Pressable>
          <Heading size="lg" className="font-bevi-bold text-on-surface">Edit profile</Heading>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}>
          {/* Avatar */}
          <View className="items-center py-4">
            <View className="w-24 h-24 rounded-full bg-bronze items-center justify-center">
              <Text bold className="font-bevi-bold text-on-surface text-3xl">{initials}</Text>
            </View>
          </View>

          <View className="bg-surface rounded-card p-4 gap-3.5">
            <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" error={touched ? nameError : ''} autoCapitalize="words" />
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" error={touched ? emailError : ''} keyboardType="email-address" autoCapitalize="none" />
            <Field label="New password (optional)" value={password} onChangeText={setPassword} placeholder="Leave blank to keep current" error={touched ? passwordError : ''} secureTextEntry autoCapitalize="none" />
            <Text size="xs" className="font-bevi text-muted">Phone number can be updated from the web app.</Text>
          </View>

          {formError ? (
            <View className="bg-red-50 rounded-field px-3 py-2.5 mt-3 flex-row items-start gap-2">
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text size="sm" className="font-bevi text-red-600 flex-1">{formError}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-hairline/30 px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          <Pressable
            disabled={updateProfile.isPending}
            onPress={handleSave}
            className="bg-on-surface rounded-card py-3.5 items-center"
            style={{ opacity: updateProfile.isPending ? 0.6 : 1 }}
          >
            <Text bold className="font-bevi-bold text-white text-base">{updateProfile.isPending ? 'Saving…' : 'Save changes'}</Text>
          </Pressable>
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
  secureTextEntry?: boolean;
}

function Field({ label, value, onChangeText, placeholder, error, keyboardType, autoCapitalize, secureTextEntry }: FieldProps) {
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
        secureTextEntry={secureTextEntry}
        className={`border rounded-field px-3 h-11 text-on-surface text-sm ${error ? 'border-red-400' : 'border-hairline/50'}`}
      />
      {error ? <Text size="xs" className="font-bevi text-red-500 mt-1">{error}</Text> : null}
    </View>
  );
}
