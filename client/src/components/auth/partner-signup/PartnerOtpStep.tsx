import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepBackButton } from './fields';

const OTP_LENGTH = 6;

interface PartnerOtpStepProps {
  email: string;
  onBack: () => void;
  onResend: () => void;
  onVerify: (code: string) => Promise<void>;
  isResending: boolean;
  isRegistering: boolean;
  apiError: string | null;
}

export function PartnerOtpStep({
  email,
  onBack,
  onResend,
  onVerify,
  isResending,
  isRegistering,
  apiError,
}: PartnerOtpStepProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(59);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const code = digits.join('');
  const complete = code.length === OTP_LENGTH;

  const setDigit = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    setDigits(prev => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number
  ) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      setDigits(prev => {
        const next = [...prev];
        next[i - 1] = '';
        return next;
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = () => {
    if (seconds > 0 || isResending) return;
    onResend();
    setSeconds(59);
  };

  return (
    <section>
      <StepBackButton onClick={onBack} />

      <header className="mb-6">
        <h2 className="text-2xl font-bold text-on-surface mb-1.5">
          Verify your email
        </h2>
        <p className="text-sm text-on-surface-variant">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-on-surface">{email}</span>.
        </p>
      </header>

      {apiError && (
        <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-sm font-semibold mb-5">
          {apiError}
        </div>
      )}

      <div
        className="grid grid-cols-6 gap-2 sm:gap-3 mb-6"
        onPaste={handlePaste}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => {
              inputs.current[i] = el;
            }}
            value={d}
            onChange={e => setDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(e, i)}
            inputMode="numeric"
            maxLength={1}
            className="aspect-square w-full text-center text-2xl font-bold rounded-xl border border-slate-200 bg-slate-50 focus:border-role-partner-primary focus:bg-white focus:ring-2 focus:ring-role-partner-primary/20 outline-none transition-all"
          />
        ))}
      </div>

      <Button
        type="button"
        disabled={!complete || isRegistering}
        onClick={() => onVerify(code)}
        className="w-full h-12 bg-role-partner-primary hover:bg-role-partner-secondary text-white font-semibold rounded-xl shadow-lg shadow-role-partner-primary/20 cursor-pointer"
      >
        {isRegistering ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating
            account...
          </>
        ) : (
          <>
            Create partner account
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-on-surface-variant mt-5">
        Didn't receive it?{' '}
        {seconds > 0 ? (
          <span className="font-semibold text-on-surface">
            Resend in 00:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-semibold text-role-partner-primary hover:underline cursor-pointer"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        )}
      </p>
    </section>
  );
}
