import React, { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`Welcome back, ${email}!`);
      // Reset form or redirect
    }, 1500);
  };

  return (
    <div className="relative min-h-screen text-on-surface select-none overflow-hidden flex items-center justify-center p-gutter-mobile bg-background">
      {/* Inline styles for custom classes */}
      <style>{`
        .glass-card {
          background: rgba(245, 242, 238, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 4px 20px rgba(28, 27, 27, 0.04);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-[480px]">
        {/* Brand Logo Center */}
        <div className="text-center mb-stack-lg">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <h1 className="font-display-lg text-3xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-secondary via-secondary-fixed-dim to-secondary text-glow">
              Smart Stay AI
            </h1>
          </Link>
        </div>

        <div className="glass-card rounded-xxl p-stack-lg md:p-12 border border-white/20">
          
          {/* Branding/Header */}
          <div className="text-center mb-stack-lg">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 font-semibold">
              Welcome Back
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Log in to your personal concierge dashboard.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-stack-md" onSubmit={handleSubmit}>
            {/* Email Container */}
            <div 
              style={{
                transform: emailFocused ? "translateY(-2px)" : "translateY(0px)",
                transition: "transform 0.3s ease"
              }}
            >
              <Label className="font-label-sm text-label-sm text-on-surface-variant block mb-stack-sm uppercase" htmlFor="email">
                Email Address
              </Label>
              <Input 
                className="w-full bg-surface-container-low border-none rounded-xl h-14 px-4 font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
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

            {/* Password Container */}
            <div 
              style={{
                transform: passwordFocused ? "translateY(-2px)" : "translateY(0px)",
                transition: "transform 0.3s ease"
              }}
            >
              <div className="flex justify-between items-center mb-stack-sm">
                <Label className="font-label-sm text-label-sm text-on-surface-variant uppercase" htmlFor="password">
                  Password
                </Label>
                <Link 
                  className="font-label-sm text-label-sm text-secondary hover:text-on-secondary-container transition-colors" 
                  to="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  className="w-full bg-surface-container-low border-none rounded-xl h-14 pl-4 pr-12 font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                />
                <Button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer outline-none bg-transparent hover:bg-transparent border-none p-0 size-auto" 
                  type="button"
                  onClick={togglePasswordVisibility}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </Button>
              </div>
            </div>

            <Button 
              className="w-full bg-primary text-on-primary font-label-lg text-label-lg py-4 rounded-full shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all mt-stack-md uppercase tracking-widest cursor-pointer outline-none border-none h-auto" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-stack-lg">
            <div className="flex-grow border-t border-outline-variant/30"></div>
            <span className="flex-shrink mx-4 font-label-sm text-label-sm text-outline uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-outline-variant/30"></div>
          </div>

          {/* Social Login */}
          <Button 
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
            Login with Google
          </Button>

          {/* Footer Link */}
          <div className="text-center mt-stack-lg space-y-4">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account?{" "}
              <Link className="text-secondary font-semibold hover:underline transition-all" to="/register">
                Register
              </Link>
            </p>
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-outline-variant/30">
              <a 
                className="font-label-sm text-label-sm text-on-surface-variant uppercase hover:text-primary tracking-widest outline-none cursor-pointer" 
                href="#legal" 
                onClick={(e) => { e.preventDefault(); alert("Legal info..."); }}
              >
                LEGAL
              </a>
              <a 
                className="font-label-sm text-label-sm text-on-surface-variant uppercase hover:text-primary tracking-widest outline-none cursor-pointer" 
                href="#privacy" 
                onClick={(e) => { e.preventDefault(); alert("Privacy policy..."); }}
              >
                PRIVACY
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
