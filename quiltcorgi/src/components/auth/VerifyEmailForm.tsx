'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

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
      setTimeout(() => router.push('/auth/signin'), 1500);
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
    <div className="w-full max-w-[420px] mx-auto bg-surface-container-low rounded-xl shadow-elevation-2 p-[2.75rem]">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-[length:var(--font-size-headline-md)] font-bold text-on-surface">
          Verify your email
        </h1>
        <p className="mt-2 text-[length:var(--font-size-body-sm)] text-secondary text-center">
          We sent a verification code to your email. Enter it below to verify your account.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-sm bg-error/10 border border-error/20 px-4 py-3 text-[length:var(--font-size-body-sm)] text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-sm bg-green-50 border border-green-200 px-4 py-3 text-[length:var(--font-size-body-sm)] text-green-800">
          {success}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="verify-email" className="block text-[length:var(--font-size-body-sm)] font-medium text-secondary mb-1.5">
            Email
          </label>
          <input
            id="verify-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary rounded-t-sm px-3 py-2.5 text-[length:var(--font-size-body-md)] text-on-surface placeholder:text-secondary/60 outline-none transition-colors duration-200"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="code" className="block text-[length:var(--font-size-body-sm)] font-medium text-secondary mb-1.5">
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary rounded-t-sm px-3 py-2.5 text-[length:var(--font-size-body-md)] text-on-surface placeholder:text-secondary/60 outline-none transition-colors duration-200 tracking-[0.3em] text-center text-lg"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-on rounded-md px-4 py-3 text-[length:var(--font-size-body-md)] font-medium hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-[length:var(--font-size-body-sm)] text-primary hover:underline disabled:opacity-50"
        >
          {isResending ? 'Sending...' : "Didn't receive a code? Resend"}
        </button>
      </div>

      <p className="mt-6 text-center text-[length:var(--font-size-body-sm)] text-secondary">
        <Link href="/auth/signin" className="text-primary hover:underline font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
