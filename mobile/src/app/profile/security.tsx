import { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useChangePassword, useDeleteAccount } from '@/hooks/users';
import { GUEST_COLORS } from '@/constants/guestTheme';
import { passwordViolation } from '@/validations/auth.validation';


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
  const { t } = useTranslation(['account', 'common']);
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleChangePassword() {
    setFormError('');
    setSaved(false);
    if (!currentPassword) {
      setFormError(t('account:security.currentRequired'));
      return;
    }
    // BE (`changeMyPassword` → `custom.validation.password`) đòi ≥8 ký tự VÀ có cả chữ lẫn số;
    // trước đây chỉ kiểm độ dài nên "12345678" phải chờ BE trả 400 mới biết.
    const violation = passwordViolation(newPassword);
    if (violation === 'required' || violation === 'tooShort') {
      setFormError(t('account:security.tooShort'));
      return;
    }
    if (violation === 'needLetterAndNumber') {
      setFormError(t('account:security.needLetterAndNumber'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError(t('account:security.mismatch'));
      return;
    }
    if (newPassword === currentPassword) {
      setFormError(t('account:security.sameAsOld'));
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
    } catch (err) {
      setFormError(errorMessage(err, t('account:security.updateFailed')));
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      t('account:security.deleteTitle'),
      t('account:security.deleteBody'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('account:security.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync();
              router.replace('/(auth)/login');
            } catch (err) {
              Alert.alert(t('account:security.error'), errorMessage(err, t('account:security.deleteFailed')));
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
        <Heading size="lg" className="font-bevi-bold text-on-surface">{t('account:security.title')}</Heading>
      </View>

      <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
        <View className="bg-surface rounded-card p-4">
          <Heading size="md" className="font-bevi-bold text-on-surface mb-1">{t('account:security.changePassword')}</Heading>
          <Text size="sm" className="font-bevi text-muted mb-3">{t('account:security.hint')}</Text>

          <PasswordField
            label={t('account:security.currentPassword')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            showLabel={t('account:security.showPassword')}
            hideLabel={t('account:security.hidePassword')}
          />
          <PasswordField
            label={t('account:security.newPassword')}
            value={newPassword}
            onChangeText={setNewPassword}
            showLabel={t('account:security.showPassword')}
            hideLabel={t('account:security.hidePassword')}
          />
          <PasswordField
            label={t('account:security.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            showLabel={t('account:security.showPassword')}
            hideLabel={t('account:security.hidePassword')}
          />

          {formError ? <Text size="sm" className="font-bevi text-red-600 mb-2">{formError}</Text> : null}
          {saved ? <Text size="sm" className="font-bevi text-green-600 mb-2">{t('account:security.updated')}</Text> : null}

          <Pressable
            disabled={changePassword.isPending}
            onPress={handleChangePassword}
            className="bg-on-surface rounded-card py-3 items-center"
          >
            <Text bold className="font-bevi-bold text-white">
              {changePassword.isPending ? t('account:security.updating') : t('account:security.update')}
            </Text>
          </Pressable>
        </View>

        <View className="bg-surface rounded-card p-4 border border-red-100">
          <Heading size="md" className="font-bevi-bold text-red-600 mb-1">{t('account:security.deleteTitle')}</Heading>
          <Text size="sm" className="font-bevi text-muted mb-3">
            {t('account:security.deleteBody')}
          </Text>
          <Pressable
            disabled={deleteAccount.isPending}
            onPress={handleDeleteAccount}
            className="border border-red-200 rounded-card py-3 items-center flex-row justify-center gap-2"
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text bold className="font-bevi-bold text-red-600">
              {deleteAccount.isPending ? t('account:security.deleting') : t('account:security.deleteConfirm')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  showLabel: string;
  hideLabel: string;
}

/** Ô mật khẩu có nút con mắt ẩn/hiện — giữ đúng style ô nhập của màn Security. */
function PasswordField({ label, value, onChangeText, showLabel, hideLabel }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-3">
      <Text size="xs" className="font-bevi text-on-surface-variant mb-1">{label}</Text>
      <View className="flex-row items-center rounded-field border border-hairline/50 px-3.5">
        <TextInput
          secureTextEntry={!visible}
          autoCapitalize="none"
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          placeholderTextColor={GUEST_COLORS.muted}
          className="flex-1 py-3 text-on-surface"
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? hideLabel : showLabel}
          className="pl-2 py-1"
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={GUEST_COLORS.muted} />
        </Pressable>
      </View>
    </View>
  );
}
