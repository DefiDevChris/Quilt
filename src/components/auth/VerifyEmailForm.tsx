'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { COLORS, withAlpha } from '@/lib/design-system';

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';
  const redirectTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    return () => clearTimeout(redirectTimeoutRef.current);
  }, []);

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/cognito/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Verification failed');
        setIsLoading(false);
        return;
      }

      setSuccess('Email verified! Redirecting to sign in...');
      redirectTimeoutRef.current = setTimeout(() => router.push('/auth/signin'), 1500);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      const res = await fetch('/api/auth/cognito/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess('A new verification code has been sent to your email.');
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="auth-form-panel">
      <div className="auth-form-inner">
        {/* Mobile Logo */}
        <div className="lg:hidden flex justify-center mb-8">
          <Link href="/" className="relative block w-14 h-14">
            <Image
              src="/logo.png"
              alt="QuiltCorgi — Back to home"
              fill
              sizes="56px"
              className="object-contain"
              priority
            />
          </Link>
        </div>

        <div className="auth-form-header">
          <h1 className="auth-form-title">Verify your email</h1>
          <p className="auth-form-subtitle">
            We sent a verification code to your email. Enter it below to verify your account.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-lg border px-4 py-3 text-sm"
            style={{
              backgroundColor: withAlpha(COLORS.error, 0.05),
              borderColor: withAlpha(COLORS.error, 0.2),
              color: COLORS.error,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            aria-live="polite"
            className="mb-4 rounded-lg border px-4 py-3 text-sm"
            style={{
              backgroundColor: withAlpha(COLORS.success, 0.05),
              borderColor: withAlpha(COLORS.success, 0.2),
              color: COLORS.success,
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label htmlFor="verify-email" className="block text-sm font-medium text-default mb-2">
              Email
            </label>
            <input
              id="verify-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              autoComplete="email"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-default mb-2">
              Verification Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="auth-input text-center"
              placeholder="000000"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="auth-submit-btn"
          >
            {isLoading ? 'Verifying…' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="auth-alt-btn"
          >
            {isResending ? 'Sending…' : 'Resend Code'}
          </button>
        </div>

        <div className="auth-form-divider">
          <span className="auth-form-divider-text">Need to sign in instead?</span>
        </div>

        <Link href="/auth/signin" className="auth-alt-btn">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
