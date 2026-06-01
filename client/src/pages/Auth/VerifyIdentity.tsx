import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  verifySchema,
  type VerifyFormValues,
} from '../../validations/auth.validation';

export default function VerifyIdentity() {
  const location = useLocation();
  const navigate = useNavigate();

  // Dynamic email retrieval from route transition state
  const targetEmail = location.state?.email || 'your email address';

  const [timeLeft, setTimeLeft] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

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

  // Focus the first input field on component load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer effect
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

  // Handle digit inputs and auto-tab forward
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

    // Shift focus to the next field if a digit is entered
    if (index < 5 && singleDigit !== '') {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Backspace key navigation (jumping backwards)
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

  // Handling 6-digit numeric pasting events
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

  // Simulated OTP verify API trigger
  const onSubmit = (values: VerifyFormValues) => {
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

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      setTimeout(() => {
        alert('Verification successful!');
        navigate('/login');
      }, 1200);
    }, 1500);
  };

  const handleResend = () => {
    if (!canResend) return;
    alert(`A new 6-digit verification code has been sent to ${targetEmail}.`);
    setTimeLeft(59);
    setCanResend(false);
  };

  return (
    <div className="relative min-h-screen text-on-background overflow-hidden h-screen w-screen bg-background antialiased flex items-center justify-center p-margin-mobile">
      {/* Custom Styles */}
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
              Smart Stay AI
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

            {/* Primary Action Button */}
            <Button
              className={`w-full py-4 text-surface font-label-lg text-label-lg rounded-full ambient-shadow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none border-none h-auto ${
                isVerified
                  ? 'bg-green-800 hover:bg-green-800'
                  : 'bg-on-background hover:bg-on-background/90'
              }`}
              type="submit"
              disabled={isVerifying || isVerified}
            >
              {isVerifying ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                  Verifying...
                </>
              ) : isVerified ? (
                <>
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                  Verified
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

          {/* Secondary Actions */}
          <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-label-md text-label-md text-on-surface-variant text-center">
              Didn't receive the code?{' '}
              {canResend ? (
                <Button
                  onClick={handleResend}
                  className="text-on-background font-bold hover:underline cursor-pointer outline-none bg-transparent hover:bg-transparent border-none p-0 size-auto inline-flex"
                  type="button"
                >
                  Resend Code
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

      {/* AI Badge Overlay */}
      <div className="absolute bottom-10 right-10 hidden md:flex items-center gap-3 glass-effect premium-gold-border py-3 px-5 rounded-full ambient-shadow">
        <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></div>
        <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">
          Secure Verification Active
        </span>
      </div>

      {/* Subtle Premium Glow background effects */}
      <div className="fixed bottom-0 right-0 w-[50vw] h-128 bg-secondary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
}
