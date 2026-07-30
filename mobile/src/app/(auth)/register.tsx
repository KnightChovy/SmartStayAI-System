import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { AuthScreenLayout } from '@/components/auth';
import { LuxButton, LuxField } from '@/components/guest';
import { useRegister, useSendOtp } from '@/hooks/auth';
import { AUTH_IMAGES, GUEST_COLORS } from '@/constants/guestTheme';
import { errorMessage } from '@/utils/errorMessage';
import { emailError, fullNameError, otpError, passwordError } from '@/validations/auth.validation';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const nameValidation = fullNameError(name);
  const emailValidation = emailError(email);
  const passwordValidation = passwordError(password);
  const otpValidation = otpError(otp);

  function handleSendOtp() {
    if (emailValidation) {
      setSubmitted(true);
      return;
    }
    sendOtp(
      { email: email.trim() },
      {
        onSuccess: () => {
          setOtpSent(true);
          Alert.alert(t('register.otpSentTitle'), t('register.otpSentBody', { email: email.trim() }));
        },
        onError: err => Alert.alert(t('register.otpFailedTitle'), errorMessage(err, t('errors.generic'))),
      }
    );
  }

  function handleRegister() {
    setSubmitted(true);
    if (nameValidation || emailValidation || passwordValidation || otpValidation) {
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('register.mismatchTitle'), t('register.mismatchBody'));
      return;
    }
    if (!agreedToTerms) {
      Alert.alert(t('register.termsTitle'), t('register.termsBody'));
      return;
    }
    register(
      { name: name.trim(), email: email.trim(), password, verificationCode: otp.trim() },
      {
        onSuccess: () => router.replace('/(tabs)'),
        onError: err => Alert.alert(t('register.failedTitle'), errorMessage(err, t('errors.generic'))),
      }
    );
  }

  return (
    // Hero thấp hơn Login: màn này có 5 ô nhập, ảnh cao sẽ đẩy form xuống quá sâu.
    <AuthScreenLayout
      image={AUTH_IMAGES.register}
      tagline={t('register.tagline')}
      onBack={() => router.back()}
      heroHeight={230}
    >
      <Heading className="font-bevi-bold text-on-surface" size="2xl">
        {t('register.title')}
      </Heading>
      <Text className="mb-6 mt-1 font-bevi text-on-surface-variant" size="sm">
        {t('register.subtitle')}
      </Text>

      <LuxField
        label={t('fields.fullName')}
        icon="person-outline"
        placeholder={t('fields.fullNamePlaceholder')}
        value={name}
        onChangeText={setName}
        error={submitted ? nameValidation ?? undefined : undefined}
      />

      {/* Email + gửi OTP: nút nằm ngay cạnh ô vì OTP gửi tới chính email này. */}
      <View className="mb-4 flex-row items-end gap-2">
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
          containerClassName="mb-0 flex-1"
        />
        <Pressable
          onPress={handleSendOtp}
          disabled={isSendingOtp}
          className={`h-12 justify-center rounded-field px-4 ${otpSent ? 'bg-bronze/15' : 'bg-on-surface'}`}
        >
          <Text
            className={`font-bevi-bold uppercase tracking-[1px] ${otpSent ? 'text-bronze' : 'text-white'}`}
            size="xs"
          >
            {isSendingOtp ? '…' : otpSent ? t('register.codeSent') : t('register.sendCode')}
          </Text>
        </Pressable>
      </View>

      <LuxField
        label={t('fields.code')}
        icon="key-outline"
        placeholder={t('fields.codePlaceholder')}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        containerClassName={otpSent ? '' : 'opacity-60'}
        error={submitted ? otpValidation ?? undefined : undefined}
      />

      <LuxField
        label={t('fields.password')}
        icon="lock-closed-outline"
        placeholder={t('fields.passwordHint')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        onToggleSecure={() => setShowPassword(v => !v)}
        secureVisible={showPassword}
        error={submitted ? passwordValidation ?? undefined : undefined}
      />

      <LuxField
        label={t('fields.confirmPassword')}
        icon="lock-closed-outline"
        placeholder={t('fields.confirmPasswordPlaceholder')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        autoCapitalize="none"
        onToggleSecure={() => setShowConfirmPassword(v => !v)}
        secureVisible={showConfirmPassword}
        error={passwordMismatch ? t('register.mismatchInline') : undefined}
      />

      <Pressable
        onPress={() => setAgreedToTerms(v => !v)}
        className="mb-6 mt-1 flex-row items-center gap-3"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreedToTerms }}
      >
        <View
          className={`h-5 w-5 items-center justify-center rounded-[6px] border ${
            agreedToTerms ? 'border-on-surface bg-on-surface' : 'border-hairline bg-surface-lowest'
          }`}
        >
          {agreedToTerms ? <Ionicons name="checkmark" size={14} color={GUEST_COLORS.white} /> : null}
        </View>
        <Text className="flex-1 font-bevi text-on-surface-variant" size="xs">
          {t('register.terms')}
        </Text>
      </Pressable>

      <LuxButton label={t('register.submit')} onPress={handleRegister} loading={isRegistering} />

      <View className="mt-7 flex-row justify-center">
        <Text className="font-bevi text-on-surface-variant" size="sm">
          {t('register.hasAccount')}{' '}
        </Text>
        <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
          <Text className="font-bevi-bold text-on-surface underline" size="sm">
            {t('register.signIn')}
          </Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
