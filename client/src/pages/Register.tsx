import React, { useState } from "react";
import { Link } from "react-router";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email address first.");
      return;
    }
    setOtpSent(true);
    setTimeout(() => {
      setOtpSent(false);
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !verificationCode) {
      alert("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match. Please verify your passwords.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`Successfully registered account for ${email}!`);
      // Reset form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setVerificationCode("");
    }, 1500);
  };

  return (
    <div className="relative min-h-screen text-on-surface select-none overflow-hidden">
      {/* Inline styles for custom elements */}
      <style>{`
        .glass-panel {
          background: rgba(245, 242, 238, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <img 
          className="w-full h-full object-cover" 
          alt="A cinematic, wide-angle view of a high-end luxury hotel atrium featuring minimalist architectural lines and warm, ambient cove lighting. The space is filled with a sophisticated palette of warm canvas, deep charcoal, and soft gold accents. Pristine marble floors reflect the soft, ethereal light coming from large floor-to-ceiling windows. The mood is exceptionally serene, private, and exclusive, embodying a quiet luxury aesthetic." 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAE8osO4PUklKy3HtzGCoCGPLlEyuj6I-JTQAHQoG3X8dJU1tuVOeQW8ESzCERsAAl3Zq13SFjcC7AOS3oa5Ljn_zvvpU5xS75ra5AJ42qp9tfHtGHVsrU58o7W9WgnJb5bXoiB9qwhq8G9rAWil_06DGEjXKMyeurhsjNUPYPHtn7ZW0RQMNTN0InRK_sLcvgI1ndbc5E1dn4aCWh8P6shB3E5EODQXOQ8gBrQSC7_VjDmSC2y8mMKf2cUKJ6cBwzCm5JR3pe_egxj" 
        />
        <div className="absolute inset-0 bg-on-background/10 backdrop-blur-[2px]"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-margin-mobile py-stack-lg">
        <div className="w-full max-w-md">
          {/* Brand Logo Center */}
          <div className="text-center mb-stack-lg">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
              <h1 className="font-display-lg text-3xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-secondary via-secondary-fixed-dim to-secondary text-glow">
                Smart Stay AI
              </h1>
            </Link>
          </div>

          {/* Registration Card */}
          <div className="glass-panel rounded-3xl p-stack-lg shadow-[0_4px_20px_rgba(26,26,26,0.04)] border border-white/20">
            <header className="text-center mb-stack-lg">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Create Account</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Experience the future of personal concierge services.</p>
            </header>

            <form className="space-y-stack-md" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant uppercase">Email Address</label>
                <div className="relative">
                  <input 
                    className="w-full h-14 px-4 bg-surface-container-low/50 border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline outline-none" 
                    placeholder="name@example.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant uppercase">Password</label>
                <div className="relative">
                  <input 
                    className="w-full h-14 px-4 bg-surface-container-low/50 border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline outline-none" 
                    placeholder="••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant uppercase">Confirm Password</label>
                <div className="relative">
                  <input 
                    className="w-full h-14 px-4 bg-surface-container-low/50 border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline outline-none" 
                    placeholder="••••••••" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Verification Row */}
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant uppercase">Verification Code</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 h-14 px-4 bg-surface-container-low/50 border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline outline-none" 
                    placeholder="123456" 
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                  <button 
                    onClick={handleSendOTP}
                    className={`h-14 px-6 border border-primary/30 rounded-xl font-label-lg text-label-lg text-primary hover:bg-primary/5 active:scale-95 transition-all whitespace-nowrap outline-none cursor-pointer ${otpSent ? 'bg-primary/10' : ''}`}
                    type="button"
                  >
                    {otpSent ? 'Sent' : 'Send OTP'}
                  </button>
                </div>
              </div>

              {/* Primary Action */}
              <div className="pt-4">
                <button 
                  className="w-full h-14 bg-on-background text-surface font-label-lg text-label-lg rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer outline-none" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Account"}
                  {!isLoading && (
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-stack-md">
                <div className="h-px flex-1 bg-outline-variant/30"></div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">or</span>
                <div className="h-px flex-1 bg-outline-variant/30"></div>
              </div>

              {/* Google Register Button */}
              <div className="mt-4">
                <button 
                  className="w-full h-14 bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-label-lg text-label-lg rounded-full shadow-sm hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer outline-none" 
                  type="button"
                  onClick={() => alert("Connecting with Google...")}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  Register with Google
                </button>
              </div>
            </form>

            {/* Footer Links */}
            <footer className="mt-stack-lg text-center space-y-4">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Already have an account?{" "}
                <Link className="text-on-surface font-semibold hover:underline transition-all" to="/login">Login</Link>
              </p>
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-outline-variant/30">
                <a className="font-label-sm text-label-sm text-on-surface-variant uppercase hover:text-primary" href="#legal" onClick={(e) => { e.preventDefault(); alert("Legal information..."); }}>Legal</a>
                <a className="font-label-sm text-label-sm text-on-surface-variant uppercase hover:text-primary" href="#privacy" onClick={(e) => { e.preventDefault(); alert("Privacy policy..."); }}>Privacy</a>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
