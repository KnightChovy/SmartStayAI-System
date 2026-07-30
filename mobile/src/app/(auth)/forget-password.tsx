import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { AuthScreenLayout } from '@/components/auth';
import { LuxButton, LuxField } from '@/components/guest';
import { useForgotPassword } from '@/hooks/auth';
import { AUTH_IMAGES, GUEST_COLORS } from '@/constants/guestTheme';
import { errorMessage } from '@/utils/errorMessage';
import { emailError } from '@/validations/auth.validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const validation = emailError(email);

  function handleSend() {
    setSubmitted(true);
    if (validation) {
      return;
    }
    forgotPassword(
      { email: email.trim() },
      {
        onSuccess: () => setSent(true),
        onError: err => Alert.alert(t('forgotPassword.failedTitle'), errorMessage(err, t('errors.generic'))),
      }
    );
  }

  return (
    <AuthScreenLayout
      image={AUTH_IMAGES.forgotPassword}
      tagline={t('forgotPassword.tagline')}
      onBack={() => router.back()}
      heroHeight={260}
    >
      {sent ? (
        <View className="items-center py-4">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-bronze/15">
            <Ionicons name="mail-open-outline" size={28} color={GUEST_COLORS.bronze} />
          </View>
          <Heading className="text-center font-bevi-bold text-on-surface" size="xl">
            {t('forgotPassword.sentTitle')}
          </Heading>
          <Text className="mb-7 mt-2 text-center font-bevi text-on-surface-variant" size="sm">
            {t('forgotPassword.sentBody')}{'\n'}
            <Text className="font-bevi-semibold text-on-surface" size="sm">
              {email.trim()}
            </Text>
          </Text>
          <LuxButton label={t('forgotPassword.backToLogin')} onPress={() => router.replace('/(auth)/login')} className="w-full" />
          <Pressable onPress={() => setSent(false)} className="mt-5 py-2" hitSlop={8}>
            <Text className="font-bevi-semibold text-bronze" size="sm">
              {t('forgotPassword.resend')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Heading className="font-bevi-bold text-on-surface" size="2xl">
            {t('forgotPassword.title')}
          </Heading>
          <Text className="mb-6 mt-1 font-bevi text-on-surface-variant" size="sm">
            {t('forgotPassword.subtitle')}
          </Text>

          <LuxField
            label={t('fields.email')}
            icon="mail-outline"
            placeholder={t('fields.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerClassName="mb-6"
            error={submitted ? validation ?? undefined : undefined}
          />

          <LuxButton label={t('forgotPassword.submit')} onPress={handleSend} loading={isPending} />

          <Pressable onPress={() => router.replace('/(auth)/login')} className="mt-7 self-center py-2" hitSlop={8}>
            <Text className="font-bevi-semibold text-on-surface underline" size="sm">
              {t('forgotPassword.backToLogin')}
            </Text>
          </Pressable>
        </>
      )}
    </AuthScreenLayout>
  );
}
