'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type Step = 'request' | 'reset';

export function ForgotPasswordForm() {
  const router = useRouter();
  const redirectTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    return () => clearTimeout(redirectTimeoutRef.current);
  }, []);

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await fetch('/api/auth/cognito/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Always advance to step 2 (prevents email enumeration)
      setStep('reset');
      setSuccess('If an account exists with that email, a reset code has been sent.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/cognito/forgot-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Password reset failed');
        setIsLoading(false);
        return;
      }

      setSuccess('Password reset! Redirecting to sign in...');
      redirectTimeoutRef.current = setTimeout(() => router.push('/auth/signin'), 1500);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] mx-auto bg-[#fdfaf7] rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)] p-[2.75rem]">
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="w-16 h-16 mb-4 relative block">
          <Image
            src="/logo.png"
            alt="QuiltCorgi — Back to home"
            fill
            sizes="64px"
            className="object-contain"
          />
        </Link>
        <h1 className="text-headline-md font-bold text-[#1a1a1a]">
          {step === 'request' ? 'Reset your password' : 'Enter reset code'}
        </h1>
        <p className="mt-2 text-sm text-[#4a4a4a] text-center">
          {step === 'request'
            ? "Enter your email and we'll send you a reset code."
            : 'Enter the code we sent to your email and choose a new password.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-500/5 border border-green-500/20 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-sm font-medium text-[#4a4a4a] mb-1.5"
            >
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#fdfaf7] border-b border-[#d4d4d4] focus:border-primary rounded-lg px-3 py-2.5 text-base text-[#1a1a1a] placeholder:text-[#4a4a4a] outline-none transition-colors duration-150"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <div>
            <label
              htmlFor="reset-code"
              className="block text-sm font-medium text-[#4a4a4a] mb-1.5"
            >
              Reset Code
            </label>
            <input
              id="reset-code"
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#fdfaf7] border-b border-[#d4d4d4] focus:border-primary rounded-lg px-3 py-2.5 text-base text-[#1a1a1a] placeholder:text-[#4a4a4a] outline-none transition-colors duration-150 tracking-[0.3em] text-center text-lg"
              placeholder="000000"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-[#4a4a4a] mb-1.5"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#fdfaf7] border-b border-[#d4d4d4] focus:border-primary rounded-lg px-3 py-2.5 pr-10 text-base text-[#1a1a1a] placeholder:text-[#4a4a4a] outline-none transition-colors duration-150"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors duration-150"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    className="w-4.5 h-4.5"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 3l14 14M8.5 8.8a2.5 2.5 0 003.4 3.4" strokeLinecap="round" />
                    <path
                      d="M6.3 6.6C4.5 7.8 3.2 9.5 2.5 10c1.5 2 4.2 5 7.5 5 1.3 0 2.5-.4 3.5-1M10 5c3.3 0 6 3 7.5 5-.4.6-1 1.4-1.7 2.1"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4.5 h-4.5"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M10 5c3.3 0 6 3 7.5 5-1.5 2-4.2 5-7.5 5s-6-3-7.5-5C4 8 6.7 5 10 5z" />
                    <circle cx="10" cy="10" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1.5 text-sm text-[#4a4a4a]">
              Must include uppercase, lowercase, and numbers
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[#4a4a4a]">
        <Link href="/auth/signin" className="text-primary hover:underline font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
