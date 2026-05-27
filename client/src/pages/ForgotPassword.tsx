import React, { useState } from "react";
import { Link, useNavigate } from "react-router";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/verify-identity", { state: { email } });
    }, 1500);
  };

  return (
    <div className="relative min-h-screen text-on-surface select-none overflow-hidden h-screen w-screen bg-background antialiased flex items-center justify-center px-margin-mobile">
      {/* Custom Styles */}
      <style>{`
        .glass-card {
          background: rgba(245, 242, 238, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .full-bleed-bg {
          background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuDIRgh1LIpOu2hllk0ZtsPimWMcKCvqEwhPyx87ZKThDSnebcc4C5q5yk02ZvRhN7qTy_BADJaKvqIskz3yzxyvsWA1NJofm4rBViCEv_iWDJmi_Q_ynqRUvOyXdYjn-VmQsrthhEpmJug22A0PLmdABSBZfxhw7JUlCkcFq9WvskoJwB-YXB92M-EDJT3EqRIsM1eD7GtCYsCfWEUtMFocSPNbjR2ECBAJeO7l8Lf-jZAw0PtHMMwyx_26N2u5U8eBrh_nNZJpxZek);
          background-size: cover;
          background-position: center;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      {/* Full-bleed background layer */}
      <div className="fixed inset-0 full-bleed-bg z-0">
        <div className="absolute inset-0 bg-black/10 backdrop-contrast-75"></div>
      </div>

      {/* Centered Content Canvas */}
      <main className="relative z-10 w-full max-w-md">
        {/* Brand Logo Center */}
        <div className="text-center mb-stack-lg">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <h1 className="font-display-lg text-3xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-secondary via-secondary-fixed-dim to-secondary text-glow">
              Smart Stay AI
            </h1>
          </Link>
        </div>

        {/* Glassmorphic Card with Spring Micro-interaction */}
        <div
          className="glass-card w-full p-stack-lg rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] duration-700"
          style={{
            transform: emailFocused ? "scale(1.01)" : "scale(1)",
            transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}
        >
          {/* Header Content */}
          <div className="text-center mb-stack-lg">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-stack-sm font-semibold">
              Reset Your Password
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Reset Form */}
          <form className="space-y-stack-md" onSubmit={handleSubmit}>
            <div>
              <label className="block font-label-lg text-label-lg text-on-surface-variant mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full bg-primary-container border-none focus:ring-2 focus:ring-secondary/20 rounded-[16px] px-4 py-3 text-body-md text-on-surface placeholder:text-outline-variant transition-all duration-300 outline-none"
                id="email"
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
              />
            </div>

            {/* Primary CTA */}
            <button
              className="w-full bg-primary text-on-primary font-label-lg text-label-lg py-4 rounded-[16px] hover:bg-on-surface-variant active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group cursor-pointer outline-none"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
              {!isLoading && (
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              )}
            </button>
          </form>

          {/* Secondary Actions */}
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

      {/* Subtle Premium Glow */}
      <div className="fixed bottom-0 right-0 w-[50vw] h-[512px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-0 left-0 w-[30vw] h-[307px] bg-primary/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
}
