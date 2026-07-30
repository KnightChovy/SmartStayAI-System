import { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useMyProfile, useUpdateMyProfile } from '@/hooks/users';
import { useUploadImage } from '@/hooks/uploads';
import { getInitials } from '@/utils/hotel';
import type { MyProfile, UpdateMyProfilePayload } from '@/types/users.type';
import { GUEST_COLORS } from '@/constants/guestTheme';
import { fullNameError, phoneError } from '@/validations/auth.validation';

/** Ngày sinh hợp lệ: đúng định dạng YYYY-MM-DD, là ngày thật, không ở tương lai. */
function isValidDob(value: string): boolean {
  if (!value) return true; // để trống là hợp lệ (không bắt buộc)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  if (value !== d.toISOString().slice(0, 10)) return false; // chặn 2026-02-30
  return d.getTime() <= Date.now();
}

/** Lấy message lỗi từ axios error mà không dùng `any`. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

const norm = (v: string | null | undefined) => (v ?? '').trim();

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const uploadImage = useUploadImage();

  const [form, setForm] = useState<MyProfile | null>(null);
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState('');

  // Seed form 1 lần khi profile tải xong.
  useEffect(() => {
    if (profile && !form) setForm(profile);
  }, [profile, form]);

  const set = <K extends keyof MyProfile>(key: K, value: MyProfile[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const nameError = form ? fullNameError(form.fullName) ?? '' : '';
  const phoneValidation = form ? phoneError(form.phone ?? '') ?? '' : '';
  const dobError = form && !isValidDob(form.dateOfBirth ?? '') ? t('account:edit.dobInvalid') : '';
  const nationalityError = form && (form.nationality?.trim().length ?? 0) > 100 ? 'Quốc tịch không quá 100 ký tự.' : '';
  const idCardError = form && (form.idCardNumber?.trim().length ?? 0) > 50 ? 'CCCD/CMND không quá 50 ký tự.' : '';
  const passportError = form && (form.passportNumber?.trim().length ?? 0) > 50 ? 'Hộ chiếu không quá 50 ký tự.' : '';
  const valid = !nameError && !phoneValidation && !dobError && !nationalityError && !idCardError && !passportError;

  async function pickAvatar() {
    setFormError('');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !res.assets[0]?.uri) return;
    try {
      const { url } = await uploadImage.mutateAsync({ uri: res.assets[0].uri, folder: 'avatars' });
      set('avatarUrl', url);
    } catch (err) {
      setFormError(errorMessage(err, t('account:edit.uploadError')));
    }
  }

  async function handleSave() {
    if (!form || !profile) return;
    setTouched(true);
    setFormError('');
    if (!valid) return;

    // Chỉ gửi field thực sự thay đổi (BE yêu cầu tối thiểu 1 field).
    const patch: UpdateMyProfilePayload = {};
    if (form.fullName.trim() !== norm(profile.fullName)) patch.fullName = form.fullName.trim();
    if (norm(form.phone) !== norm(profile.phone)) patch.phone = norm(form.phone);
    if (norm(form.avatarUrl) !== norm(profile.avatarUrl)) patch.avatarUrl = norm(form.avatarUrl);
    if (norm(form.dateOfBirth) !== norm(profile.dateOfBirth)) patch.dateOfBirth = norm(form.dateOfBirth);
    if (norm(form.nationality) !== norm(profile.nationality)) patch.nationality = norm(form.nationality);
    if (norm(form.idCardNumber) !== norm(profile.idCardNumber)) patch.idCardNumber = norm(form.idCardNumber);
    if (norm(form.passportNumber) !== norm(profile.passportNumber)) patch.passportNumber = norm(form.passportNumber);

    if (Object.keys(patch).length === 0) {
      router.back();
      return;
    }

    try {
      await updateProfile.mutateAsync(patch);
      Alert.alert(t('account:edit.saved'), undefined, [{ text: t('common:ok', 'OK'), onPress: () => router.back() }]);
    } catch (err) {
      setFormError(errorMessage(err, t('account:edit.failed')));
    }
  }

  const initials = getInitials(form?.fullName || profile?.fullName);
  const busy = updateProfile.isPending || uploadImage.isPending;

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} className="bg-surface">
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-hairline/30">
          <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
          </Pressable>
          <Heading size="lg" className="font-bevi-bold text-on-surface">{t('account:edit.title')}</Heading>
        </View>
      </SafeAreaView>

      {isLoading || !form ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={GUEST_COLORS.onSurface} />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}>
            {/* Avatar */}
            <View className="bg-surface rounded-card p-4 flex-row items-center gap-4">
              {form.avatarUrl ? (
                <Image source={{ uri: form.avatarUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} contentFit="cover" />
              ) : (
                <View className="w-[72px] h-[72px] rounded-full bg-bronze items-center justify-center">
                  <Text bold className="font-bevi-bold text-on-surface text-2xl">{initials}</Text>
                </View>
              )}
              <View className="flex-1">
                <Text size="sm" bold className="font-bevi-bold text-on-surface mb-2">{t('account:edit.photo')}</Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    disabled={uploadImage.isPending}
                    onPress={pickAvatar}
                    className="flex-row items-center gap-2 border border-hairline/60 rounded-field px-3.5 py-2"
                  >
                    <Ionicons name={uploadImage.isPending ? 'hourglass-outline' : 'cloud-upload-outline'} size={16} color={GUEST_COLORS.onSurface} />
                    <Text size="sm" bold className="font-bevi-bold text-on-surface">
                      {uploadImage.isPending ? t('account:edit.uploading') : t('account:edit.upload')}
                    </Text>
                  </Pressable>
                  {form.avatarUrl ? (
                    <Pressable onPress={() => set('avatarUrl', null)} hitSlop={6} className="px-2 py-2">
                      <Text size="sm" className="font-bevi text-muted">{t('account:edit.remove')}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Basic info */}
            <View className="bg-surface rounded-card p-4 gap-3.5 mt-3">
              <View className="flex-row gap-3">
                <Field
                  className="flex-1"
                  label={t('account:edit.name')}
                  value={form.fullName}
                  onChangeText={(v) => set('fullName', v)}
                  placeholder={t('account:edit.namePlaceholder')}
                  error={touched ? nameError : ''}
                  autoCapitalize="words"
                />
                <Field
                  className="flex-1"
                  label={t('account:edit.phone')}
                  value={form.phone ?? ''}
                  onChangeText={(v) => set('phone', v)}
                  placeholder={t('account:edit.phonePlaceholder')}
                  keyboardType="phone-pad"
                  error={touched ? phoneValidation : ''}
                />
              </View>

              {/* Email — chỉ đọc, có badge đã xác minh */}
              <View>
                <Text size="sm" bold className="font-bevi-bold text-on-surface mb-1.5">{t('account:edit.email')}</Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-1 border border-hairline/50 rounded-field px-3 h-11 justify-center bg-surface-low">
                    <Text size="sm" className="font-bevi text-muted">{form.email}</Text>
                  </View>
                  {form.emailVerifiedAt ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                      <Text size="xs" bold className="font-bevi-bold text-green-600">{t('account:edit.verified')}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View className="flex-row gap-3">
                <Field
                  className="flex-1"
                  label={t('account:edit.dob')}
                  value={form.dateOfBirth ?? ''}
                  onChangeText={(v) => set('dateOfBirth', v)}
                  placeholder={t('account:edit.dobPlaceholder')}
                  error={touched ? dobError : ''}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                  icon="calendar-outline"
                />
                <Field
                  className="flex-1"
                  label={t('account:edit.nationality')}
                  value={form.nationality ?? ''}
                  onChangeText={(v) => set('nationality', v)}
                  placeholder={t('account:edit.nationalityPlaceholder')}
                  autoCapitalize="words"
                  error={touched ? nationalityError : ''}
                />
              </View>

              <View className="flex-row gap-3">
                <Field
                  className="flex-1"
                  label={t('account:edit.idCard')}
                  value={form.idCardNumber ?? ''}
                  onChangeText={(v) => set('idCardNumber', v)}
                  placeholder={t('account:edit.idCardPlaceholder')}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  error={touched ? idCardError : ''}
                />
                <Field
                  className="flex-1"
                  label={t('account:edit.passport')}
                  value={form.passportNumber ?? ''}
                  onChangeText={(v) => set('passportNumber', v)}
                  placeholder={t('account:edit.passportPlaceholder')}
                  autoCapitalize="characters"
                  error={touched ? passportError : ''}
                />
              </View>

              <Text size="xs" className="font-bevi text-muted">{t('account:edit.emailNote')}</Text>
            </View>

            {formError ? (
              <View className="bg-red-50 rounded-field px-3 py-2.5 mt-3 flex-row items-start gap-2">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text size="sm" className="font-bevi text-red-600 flex-1">{formError}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-hairline/30 px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) + 12 }}>
            <Pressable
              disabled={busy}
              onPress={handleSave}
              className="bg-on-surface rounded-card py-3.5 items-center"
              style={{ opacity: busy ? 0.6 : 1 }}
            >
              <Text bold className="font-bevi-bold text-white text-base">
                {updateProfile.isPending ? t('account:security.updating') : t('account:edit.save', 'Save changes')}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
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
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

function Field({ label, value, onChangeText, placeholder, error, keyboardType, autoCapitalize, icon, className }: FieldProps) {
  return (
    <View className={className}>
      <Text size="sm" bold className="font-bevi-bold text-on-surface mb-1.5">{label}</Text>
      <View className={`flex-row items-center border rounded-field px-3 h-11 ${error ? 'border-red-400' : 'border-hairline/50'}`}>
        {icon ? <Ionicons name={icon} size={16} color={GUEST_COLORS.muted} style={{ marginRight: 8 }} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={GUEST_COLORS.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="flex-1 text-on-surface text-sm"
        />
      </View>
      {error ? <Text size="xs" className="font-bevi text-red-500 mt-1">{error}</Text> : null}
    </View>
  );
}
