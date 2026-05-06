import React, { useState, useEffect } from 'react';
import { signup, login, verifyOtp, resendOtp } from '../services/api';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sun,
  Moon,
  Loader2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from './ToastProvider';

type AuthView = 'login' | 'signup' | 'verify';

import type { AuthUser } from '../services/api';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  onBack?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const { toast } = useToast();

  /* ── state ─────────────────────────────────────────────── */
  const [view, setView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // theme
  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light')
    );
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  /* ── helpers ────────────────────────────────────────────── */
  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const getErrorMsg = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const resp = (err as any).response;
      return resp?.data?.detail || resp?.data?.message || 'Something went wrong.';
    }
    return 'Network error. Please try again.';
  };

  /* ── handlers ───────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsLoading(true);
    try {
      const user = await login(email, password);
      onLogin({ username: user.username, email: user.email, access_token: user.access_token, refresh_token: user.refresh_token });
    } catch (err) {
      setError(getErrorMsg(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim()) { setError('Username is required.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsLoading(true);
    try {
      await signup(username, email, password);
      setError('');
      toast('success', 'Account created! Check your email for the verification code.');
      setView('verify');
    } catch (err) {
      setError(getErrorMsg(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter the full 6-digit code.'); return; }

    setIsLoading(true);
    try {
      await verifyOtp(email, code);
      toast('success', 'Email verified successfully! Please sign in.');
      setSuccessMsg('Email verified! Please sign in.');
      setView('login');
      setPassword('');
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(getErrorMsg(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);
    try {
      await resendOtp(email);
      toast('info', 'A new verification code has been sent to your email.');
      setSuccessMsg('A new code has been sent to your email.');
    } catch (err) {
      setError(getErrorMsg(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  /* ── animated background particles ──────────────────────── */
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 10,
  }));

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-theme-mesh transition-colors duration-500">
      {/* ─── animated background ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-blue-400/20 dark:bg-blue-500/10"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            }}
          />
        ))}
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-300/10 to-indigo-300/10 dark:from-blue-800/5 dark:to-indigo-800/5 rounded-full blur-3xl" />
      </div>

      {/* ─── theme toggle (top-right) ─── */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-2.5 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-md text-slate-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-lg shadow-black/5 border border-white/40 dark:border-gray-700/50"
        aria-label="Toggle dark mode"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      {/* ─── main card ─── */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glassmorphism card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 dark:shadow-black/40 border border-white/50 dark:border-gray-700/50 overflow-hidden">
          {/* ─── header ─── */}
          <div className="relative px-8 pt-10 pb-6 text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-5">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {view === 'login' && 'Welcome Back'}
              {view === 'signup' && 'Create Account'}
              {view === 'verify' && 'Verify Email'}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
              {view === 'login' &&
                'Sign in to your Cloud Autopilot dashboard'}
              {view === 'signup' &&
                'Get started with AI-powered cloud monitoring'}
              {view === 'verify' && (
                <>
                  We sent a code to{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {email}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* ─── success message ─── */}
          {successMsg && (
            <div className="mx-8 mb-4 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              {successMsg}
            </div>
          )}

          {/* ─── error message ─── */}
          {error && (
            <div className="mx-8 mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          {/* ─── login form ─── */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-sm font-semibold text-slate-700 dark:text-gray-300"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-slate-700 dark:text-gray-300"
                >
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
                <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                  or
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
              </div>

              {/* Switch to signup */}
              <p className="text-center text-sm text-slate-500 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setView('signup');
                  }}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {/* ─── signup form ─── */}
          {view === 'signup' && (
            <form onSubmit={handleSignup} className="px-8 pb-8 space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-username"
                  className="block text-sm font-semibold text-slate-700 dark:text-gray-300"
                >
                  Username
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="cloudadmin"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-semibold text-slate-700 dark:text-gray-300"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-semibold text-slate-700 dark:text-gray-300"
                >
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password && (
                  <div className="flex gap-1 pt-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          password.length >= level * 3
                            ? level <= 1
                              ? 'bg-red-400'
                              : level <= 2
                              ? 'bg-orange-400'
                              : level <= 3
                              ? 'bg-yellow-400'
                              : 'bg-emerald-400'
                            : 'bg-slate-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
                <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                  or
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
              </div>

              {/* Switch to login */}
              <p className="text-center text-sm text-slate-500 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setView('login');
                  }}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* ─── verify form ─── */}
          {view === 'verify' && (
            <form onSubmit={handleVerify} className="px-8 pb-8 space-y-6">
              {/* OTP illustration */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/40 dark:to-blue-900/40 flex items-center justify-center">
                  <KeyRound className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              {/* OTP inputs */}
              <div className="flex justify-center gap-2.5">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(index, e.target.value.replace(/\D/g, ''))
                    }
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-slate-50 dark:bg-gray-800/60 border-2 border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verify & Continue
                  </>
                )}
              </button>

              {/* Resend */}
              <p className="text-center text-sm text-slate-500 dark:text-gray-400">
                Didn't receive a code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  Resend
                </button>
              </p>

              {/* Back */}
              <button
                type="button"
                onClick={() => {
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                  setView('signup');
                }}
                className="w-full text-center text-sm font-medium text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
              >
                ← Back to Sign Up
              </button>
            </form>
          )}
        </div>

        {/* ─── footer ─── */}
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 mx-auto flex items-center gap-2 text-sm font-medium text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        )}
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-gray-600">
          © 2026 Cloud Autopilot System · AI-Powered Cloud Intelligence
        </p>
      </div>

      {/* ─── keyframe animation ─── */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-30px) translateX(20px); opacity: 0.4; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};
