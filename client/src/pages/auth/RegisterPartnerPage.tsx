import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegisterPartner, useSendOtp } from '../../hooks/auth';
import {
  registerSchema,
  type RegisterInput,
} from '../../validations/auth.validation';
import { errorMessage } from '@/utils/errorMessage';
import {
  PartnerAccountStep,
  PartnerOtpStep,
  PartnerSignupBrandPanel,
} from '@/components/auth/partner-signup';

export default function RegisterPartnerPage() {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    mutateAsync: sendOtp,
    isPending: isSendingOtp,
    error: sendOtpError,
  } = useSendOtp();
  const {
    mutateAsync: registerPartner,
    isPending: isRegistering,
    error: registerError,
  } = useRegisterPartner();

  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Form hợp lệ → gửi OTP tới email rồi chuyển sang màn nhập mã.
  const goToVerify = async () => {
    const ok = await trigger(['name', 'email', 'password', 'confirmPassword']);
    if (!ok) return;
    await sendOtp(getValues('email'));
    setOtpSent(true);
  };

  return (
    <div className="relative min-h-screen text-on-surface select-none overflow-hidden grid lg:grid-cols-2 bg-background">
      <PartnerSignupBrandPanel />

      {/* Right form panel */}
      <div className="min-h-screen flex flex-col px-5 sm:px-8 md:px-16 lg:px-20 py-8 sm:py-12 overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto">
          {!otpSent ? (
            <PartnerAccountStep
              register={register}
              errors={errors}
              onContinue={goToVerify}
              isSubmitting={isSendingOtp}
              apiError={
                sendOtpError
                  ? errorMessage(
                      sendOtpError,
                      'Failed to send verification code. Please try again.'
                    )
                  : null
              }
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirm={showConfirm}
              setShowConfirm={setShowConfirm}
            />
          ) : (
            <PartnerOtpStep
              email={getValues('email')}
              onBack={() => setOtpSent(false)}
              onResend={() => sendOtp(getValues('email'))}
              isResending={isSendingOtp}
              isRegistering={isRegistering}
              apiError={
                registerError
                  ? errorMessage(
                      registerError,
                      'Could not create your account. Please try again.'
                    )
                  : null
              }
              onVerify={async code => {
                const v = getValues();
                await registerPartner({
                  email: v.email,
                  name: v.name,
                  password: v.password,
                  verificationCode: code,
                });

                navigate('/partner/verify', { replace: true });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
