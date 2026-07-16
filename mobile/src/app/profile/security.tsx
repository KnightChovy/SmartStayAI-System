import { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useUpdateProfile, useDeleteAccount } from '@/hooks/users';
import { GUEST_COLORS } from '@/constants/guestTheme';


/** Lấy message lỗi từ axios error mà không dùng `any`. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

export default function SecurityScreen() {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleChangePassword() {
    setFormError('');
    setSaved(false);
    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    try {
      await updateProfile.mutateAsync({ password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
    } catch (err) {
      setFormError(errorMessage(err, 'Could not update your password. Please try again.'));
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This permanently removes your account and personal data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync();
              router.replace('/(auth)/login');
            } catch (err) {
              Alert.alert('Error', errorMessage(err, 'Could not delete your account. Please try again.'));
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">Security & Privacy</Heading>
      </View>

      <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
        <View className="bg-surface rounded-card p-4">
          <Heading size="md" className="font-bevi-bold text-on-surface mb-1">Change password</Heading>
          <Text size="sm" className="font-bevi text-muted mb-3">Use at least 8 characters.</Text>

          <Text size="xs" className="font-bevi text-on-surface-variant mb-1">New password</Text>
          <TextInput
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="••••••••"
            placeholderTextColor={GUEST_COLORS.muted}
            className="mb-3 rounded-field border border-hairline/50 px-3.5 py-3 text-on-surface"
          />
          <Text size="xs" className="font-bevi text-on-surface-variant mb-1">Confirm new password</Text>
          <TextInput
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor={GUEST_COLORS.muted}
            className="mb-3 rounded-field border border-hairline/50 px-3.5 py-3 text-on-surface"
          />

          {formError ? <Text size="sm" className="font-bevi text-red-600 mb-2">{formError}</Text> : null}
          {saved ? <Text size="sm" className="font-bevi text-green-600 mb-2">Password updated.</Text> : null}

          <Pressable
            disabled={updateProfile.isPending}
            onPress={handleChangePassword}
            className="bg-on-surface rounded-card py-3 items-center"
          >
            <Text bold className="font-bevi-bold text-white">
              {updateProfile.isPending ? 'Updating…' : 'Update password'}
            </Text>
          </Pressable>
        </View>

        <View className="bg-surface rounded-card p-4 border border-red-100">
          <Heading size="md" className="font-bevi-bold text-red-600 mb-1">Delete account</Heading>
          <Text size="sm" className="font-bevi text-muted mb-3">
            Permanently remove your account and personal data. This cannot be undone.
          </Text>
          <Pressable
            disabled={deleteAccount.isPending}
            onPress={handleDeleteAccount}
            className="border border-red-200 rounded-card py-3 items-center flex-row justify-center gap-2"
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text bold className="font-bevi-bold text-red-600">
              {deleteAccount.isPending ? 'Deleting…' : 'Delete my account'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
