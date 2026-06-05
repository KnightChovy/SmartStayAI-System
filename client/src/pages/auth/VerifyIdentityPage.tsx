import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegisterMutation, useSendOtpMutation } from '../../hooks/auth';
import {
  verifySchema,
  type VerifyFormValues,
} from '../../validations/auth.validation';

export default function VerifyIdentityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    mutateAsync: registerApi,
    isPending: isRegistering,
    error: registerError,
  } = useRegisterMutation();
  const { mutateAsync: sendOtp, isPending: isSendingOtp } =
    useSendOtpMutation();

  const { email, name, password } = location.state || {};

  const targetEmail = email || 'your email address';

  const [timeLeft, setTimeLeft] = useState(59);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { register, handleSubmit, setValue, watch } = useForm<VerifyFormValues>(
    {
      resolver: zodResolver(verifySchema),
      defaultValues: {
        digit0: '',
        digit1: '',
        digit2: '',
        digit3: '',
        digit4: '',
        digit5: '',
      },
    }
  );

  const otpValues = watch([
    'digit0',
    'digit1',
    'digit2',
    'digit3',
    'digit4',
    'digit5',
  ]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    const fieldName = `digit${index}` as keyof VerifyFormValues;

    if (!val) {
      setValue(fieldName, '');
      return;
    }

    const singleDigit = val.substring(val.length - 1);
    setValue(fieldName, singleDigit);

    if (index < 5 && singleDigit !== '') {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace') {
      const fieldName = `digit${index}` as keyof VerifyFormValues;
      const currentVal = otpValues[index];

      if (currentVal === '') {
        if (index > 0) {
          const prevFieldName = `digit${index - 1}` as keyof VerifyFormValues;
          setValue(prevFieldName, '');
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        setValue(fieldName, '');
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, 6);
    if (pasteData.length === 6) {
      const digits = pasteData.split('');
      digits.forEach((digit, i) => {
        setValue(`digit${i}` as keyof VerifyFormValues, digit);
      });
      inputRefs.current[5]?.focus();
    }
  };

  const onSubmit = async (values: VerifyFormValues) => {
    const enteredOtp = [
      values.digit0,
      values.digit1,
      values.digit2,
      values.digit3,
      values.digit4,
      values.digit5,
    ].join('');

    if (enteredOtp.length < 6) {
      alert('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email || !name || !password) {
      alert('Missing registration context. Please register again.');
      navigate('/register');
      return;
    }

    try {
      await registerApi({
        email,
        name,
        password,
        verificationCode: enteredOtp,
      });
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    try {
      await sendOtp(email);
      setTimeLeft(59);
      setCanResend(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen text-on-background overflow-hidden h-screen w-screen bg-background antialiased flex items-center justify-center p-margin-mobile">
      <style>{`
        .glass-effect {
          background: rgba(245, 242, 238, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .ambient-shadow {
          box-shadow: 0 4px 20px rgba(28, 27, 27, 0.04);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        .premium-gold-border {
          border: 1px solid transparent;
          background-image: linear-gradient(#f5f2ee, #f5f2ee), linear-gradient(135deg, #e2c194, #ffe088, #e2c194);
          background-origin: border-box;
          background-clip: padding-box, border-box;
        }
      `}</style>

      {/* Verification Container */}
      <main className="relative z-10 w-full max-w-120">
        {/* Brand Logo Center */}
        <div className="text-center mb-stack-lg">
          <Link
            to="/"
            className="inline-block hover:opacity-90 transition-opacity"
          >
          <h1 className="font-display-lg text-3xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-linear-to-r from-secondary via-secondary-fixed-dim to-secondary text-glow">
                  SMART STAY AI
              </h1>
          </Link>
        </div>

        <div className="glass-effect ambient-shadow w-full rounded-xxl p-stack-lg flex flex-col items-center">
          {/* Header Content */}
          <div className="text-center mb-stack-lg">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-2 font-semibold">
              Verify Your Identity
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[320px] mx-auto">
              We've sent a 6-digit code to{' '}
              <span className="font-semibold text-on-surface">
                {targetEmail}
              </span>
              . Please enter it below to continue.
            </p>
          </div>

          {/* OTP Input Area */}
          <form
            className="w-full mb-stack-lg"
            onSubmit={handleSubmit(onSubmit)}
          >
            {registerError && (
              <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-sm font-semibold mb-4 text-center">
                {(registerError as any)?.response?.data?.message ||
                  'Verification failed. Please check the code.'}
              </div>
            )}

            <div className="grid grid-cols-6 gap-2 md:gap-3 w-full max-w-95 mx-auto mb-stack-lg">
              {[0, 1, 2, 3, 4, 5].map(index => {
                const { ref, ...rest } = register(
                  `digit${index}` as keyof VerifyFormValues
                );
                return (
                  <Input
                    key={index}
                    {...rest}
                    ref={el => {
                      ref(el);
                      inputRefs.current[index] = el;
                    }}
                    autoComplete="one-time-code"
                    className="w-full aspect-square text-center font-display-lg text-display-lg rounded-xl border-none bg-surface-container shadow-inner focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-200 outline-none p-0 flex items-center justify-center h-auto"
                    maxLength={1}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={otpValues[index]}
                    onChange={e => handleChange(e, index)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                  />
                );
              })}
            </div>

            <Button
              className="w-full py-4 text-white font-label-lg text-label-lg rounded-full ambient-shadow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none border-none h-auto bg-on-background hover:bg-on-background/90"
              type="submit"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                  Verifying...
                </>
              ) : (
                <>
                  Verify Code
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </>
              )}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-label-md text-label-md text-on-surface-variant text-center">
              Didn't receive the code?{' '}
              {canResend ? (
                <Button
                  onClick={handleResend}
                  disabled={isSendingOtp}
                  className="text-on-background font-bold hover:underline cursor-pointer outline-none bg-transparent hover:bg-transparent border-none p-0 size-auto inline-flex"
                  type="button"
                >
                  {isSendingOtp ? 'Sending...' : 'Resend Code'}
                </Button>
              ) : (
                <span className="text-on-background font-bold">
                  Resend (in{' '}
                  <span id="timer">
                    00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                  </span>
                  )
                </span>
              )}
            </p>
            <div className="w-full h-px bg-outline-variant/30 my-2"></div>
            <Link
              className="flex items-center gap-2 font-label-lg text-label-lg text-secondary hover:text-on-background transition-colors"
              to="/login"
            >
              <span className="material-symbols-outlined text-[20px]">
                keyboard_backspace
              </span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>

      <div className="absolute bottom-10 right-10 hidden md:flex items-center gap-3 glass-effect premium-gold-border py-3 px-5 rounded-full ambient-shadow">
        <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></div>
        <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">
          Secure Verification Active
        </span>
      </div>

      {/* Subtle Premium Glow background effects */}
      <div className="fixed bottom-0 right-0 w-[50vw] h-128 bg-secondary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-0 left-0 w-[30vw] h-76.75 bg-primary/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
}
