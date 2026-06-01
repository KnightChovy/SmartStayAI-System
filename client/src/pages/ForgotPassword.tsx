import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../hooks/useAuth';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, { message: 'Please enter your email address.' }).email({ message: 'Please enter a valid email address.' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, isSendingForgotPassword, forgotPasswordError, forgotPasswordSuccess } = useAuth();
  const [emailFocused, setEmailFocused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(values.email);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen text-on-surface select-none overflow-hidden h-screen w-screen bg-background antialiased flex items-center justify-center px-margin-mobile">
      <style>{`
        .glass-card {
          background: rgba(245, 242, 238, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      <main className="relative z-10 w-full max-w-md">
        <div className="text-center mb-stack-lg">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <h1 className="font-display-lg text-3xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-secondary via-secondary-fixed-dim to-secondary text-glow">
              Smart Stay AI
            </h1>
          </Link>
        </div>

        <div
          className="glass-card w-full p-stack-lg rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] duration-700"
          style={{
            transform: emailFocused ? 'scale(1.01)' : 'scale(1)',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          <div className="text-center mb-stack-lg">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-stack-sm font-semibold">
              Reset Your Password
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {forgotPasswordSuccess ? (
            <div className="space-y-6">
              <div className="bg-green-800/10 border border-green-800/20 text-green-700 p-4 rounded-xl text-center font-body-md flex flex-col items-center">
                <span className="material-symbols-outlined text-green-800 text-4xl mb-2">mark_email_read</span>
                <p className="font-semibold">Reset Link Sent!</p>
                <p className="text-sm mt-1">If this email is registered, we have sent a password reset link to it. Please check your inbox.</p>
              </div>

              <div className="bg-primary/5 border border-outline-variant/30 p-5 rounded-2xl text-left space-y-4">
                <h3 className="font-semibold text-xs text-on-surface uppercase tracking-wider">
                  Hỗ trợ chạy Local / Deploy
                </h3>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Nếu liên kết trong email chứa tên miền mặc định <code>link-to-app</code>, bạn chỉ cần sao chép toàn bộ liên kết đó rồi dán vào đây để hệ thống tự chuyển đổi và điều hướng chính xác trên máy của bạn:
                </p>
                <div className="space-y-2">
                  <Input
                    className="w-full bg-surface-container-low border-none rounded-xl h-12 px-4 text-xs outline-none"
                    placeholder="Dán liên kết http://link-to-app/... hoặc token vào đây"
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (!val) return;
                      let token = val;
                      try {
                        if (val.includes('token=')) {
                          const url = new URL(val);
                          token = url.searchParams.get('token') || val;
                        } else if (val.includes('?')) {
                          const parts = val.split('token=');
                          if (parts.length > 1) {
                            token = parts[1].split('&')[0];
                          }
                        }
                      } catch (err) {
                        const match = val.match(/token=([^&]+)/);
                        if (match) token = match[1];
                      }
                      if (token) {
                        navigate(`/reset-password?token=${token}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-stack-md" onSubmit={handleSubmit(onSubmit)}>
              {forgotPasswordError && (
                <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-sm font-semibold">
                  {(forgotPasswordError as any)?.response?.data?.message || 'Failed to send recovery email. Please try again.'}
                </div>
              )}

              <div>
                <Label className="block font-label-lg text-label-lg text-on-surface-variant mb-2" htmlFor="email">
                  Email Address
                </Label>
                <Input
                  {...register('email')}
                  className="w-full bg-primary-container border-none focus:ring-2 focus:ring-secondary/20 rounded-[16px] px-4 py-3 text-body-md text-on-surface placeholder:text-outline-variant transition-all duration-300 outline-none h-auto"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
                {errors.email && (
                  <p className="text-[10px] text-error font-semibold mt-1.5 px-1">{errors.email.message}</p>
                )}
              </div>

              <Button
                className="w-full bg-primary text-on-primary font-label-lg text-label-lg py-4 rounded-[16px] hover:bg-on-surface-variant active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group cursor-pointer outline-none border-none hover:bg-primary/95 h-auto"
                type="submit"
                disabled={isSendingForgotPassword}
              >
                {isSendingForgotPassword ? 'Sending Recovery Email...' : 'Send Recovery Email'}
                {!isSendingForgotPassword && (
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                )}
              </Button>
            </form>
          )}

          <div className="mt-stack-lg text-center">
            <Link
              className="inline-flex items-center gap-2 font-label-lg text-label-lg text-secondary hover:text-on-secondary-container transition-colors duration-200"
              to="/login"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 right-0 w-[50vw] h-[512px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-0 left-0 w-[30vw] h-[307px] bg-primary/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
}
