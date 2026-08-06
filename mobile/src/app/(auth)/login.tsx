import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { AuthScreenLayout } from '@/components/auth';
import { LuxButton, LuxField } from '@/components/guest';
import { useLogin } from '@/hooks/auth';
import { homeRouteForRole } from '@/constants/roles';
import { AUTH_IMAGES } from '@/constants/guestTheme';
import { errorMessage } from '@/utils/errorMessage';
import { emailError, loginPasswordError } from '@/validations/auth.validation';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const { mutate: login, isPending } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailValidation = emailError(email);
  const passwordValidation = loginPasswordError(password);

  function handleLogin() {
    setSubmitted(true);
    if (emailValidation || passwordValidation) {
      return;
    }
    login(
      { email: email.trim(), password },
      {
        onSuccess: ({ user }) => router.replace(homeRouteForRole(user.role)),
        onError: err => Alert.alert(t('login.failedTitle'), errorMessage(err, t('errors.generic'))),
      }
    );
  }

  return (
    <AuthScreenLayout image={AUTH_IMAGES.login} tagline={t('login.tagline')}>
      <Heading className="font-bevi-bold text-on-surface" size="2xl">
        {t('login.title')}
      </Heading>
      <Text className="mb-6 mt-1 font-bevi text-on-surface-variant" size="sm">
        {t('login.subtitle')}
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
        error={submitted ? emailValidation ?? undefined : undefined}
      />

      <LuxField
        label={t('fields.password')}
        icon="lock-closed-outline"
        placeholder={t('fields.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        onToggleSecure={() => setShowPassword(v => !v)}
        secureVisible={showPassword}
        containerClassName="mb-2"
        error={submitted ? passwordValidation ?? undefined : undefined}
      />

      <Pressable onPress={() => router.push('/(auth)/forget-password')} className="mb-6 self-end py-2" hitSlop={4}>
        <Text className="font-bevi-semibold text-bronze" size="sm">
          {t('login.forgotPassword')}
        </Text>
      </Pressable>

      <LuxButton label={t('login.submit')} onPress={handleLogin} loading={isPending} />

      <View className="mt-7 flex-row justify-center">
        <Text className="font-bevi text-on-surface-variant" size="sm">
          {t('login.noAccount')}{' '}
        </Text>
        <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}>
          <Text className="font-bevi-bold text-on-surface underline" size="sm">
            {t('login.signUp')}
          </Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
