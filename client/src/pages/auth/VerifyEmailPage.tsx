import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useVerifyEmailMutation } from '../../hooks/auth';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const {
    mutateAsync: verifyEmail,
    isPending: isVerifyingEmail,
    error: verifyEmailError,
    isSuccess: verifyEmailSuccess,
  } = useVerifyEmailMutation();

  useEffect(() => {
    if (token) {
      verifyEmail(token).catch(err => {
        console.error('Email verification error:', err);
      });
    }
  }, [token, verifyEmail]);

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
          <Link
            to="/"
            className="inline-block hover:opacity-90 transition-opacity"
          >
         <h1 className="font-display-lg text-3xl font-extrabold tracking-widest uppercase text-black-">
                  SMART STAY AI
              </h1>
          </Link>
        </div>

        <div className="glass-card w-full p-stack-lg rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col items-center text-center">
          <div className="mb-stack-lg">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-stack-sm font-semibold">
              Email Verification
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto">
              Xác thực email của bạn để kích hoạt đầy đủ tính năng concierge.
            </p>
          </div>

          {!token ? (
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-error text-5xl mb-4">
                error
              </span>
              <p className="font-semibold text-lg text-error">Missing Token</p>
              <p className="text-sm text-on-surface-variant mt-2 max-w-[300px]">
                Mã xác minh không tồn tại hoặc không hợp lệ. Vui lòng kiểm tra
                lại liên kết trong email của bạn.
              </p>
              <Link
                to="/"
                className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-lg hover:bg-primary/90 transition-all uppercase tracking-wider"
              >
                Go to Home
              </Link>
            </div>
          ) : isVerifyingEmail ? (
            <div className="flex flex-col items-center py-6">
              <span className="material-symbols-outlined text-secondary text-5xl mb-4 animate-spin">
                progress_activity
              </span>
              <p className="font-semibold text-lg">Verifying Your Email...</p>
              <p className="text-sm text-on-surface-variant mt-2">
                Hệ thống đang tiến hành kiểm tra mã xác thực của bạn. Vui lòng
                chờ trong giây lát.
              </p>
            </div>
          ) : verifyEmailSuccess ? (
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-green-800 text-5xl mb-4 animate-bounce">
                check_circle
              </span>
              <p className="font-semibold text-lg text-green-700">
                Email Verified Successfully!
              </p>
              <p className="text-sm text-on-surface-variant mt-2 max-w-[300px]">
                Tài khoản của bạn đã được kích hoạt thành công. Bạn hiện có thể
                đăng nhập để trải nghiệm SmartStay AI.
              </p>
              <Link
                to="/login"
                className="mt-6 px-8 py-3 bg-primary text-on-primary rounded-full font-label-lg hover:bg-primary/90 active:scale-[0.98] transition-all uppercase tracking-wider shadow-md"
              >
                Log In Now
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-error text-5xl mb-4">
                cancel
              </span>
              <p className="font-semibold text-lg text-error">
                Verification Failed
              </p>
              <p className="text-sm text-on-surface-variant mt-2 max-w-[300px]">
                {(verifyEmailError as any)?.response?.data?.message ||
                  'Mã xác thực đã hết hạn hoặc không chính xác. Vui lòng yêu cầu gửi lại email xác thực.'}
              </p>
              <Link
                to="/login"
                className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-lg hover:bg-primary/90 transition-all uppercase tracking-wider"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 right-0 w-[50vw] h-128 bg-secondary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-0 left-0 w-[30vw] h-76.75 bg-primary/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
}
