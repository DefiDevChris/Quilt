'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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
    <div className="w-full max-w-[420px] mx-auto bg-neutral-100 rounded-full shadow-elevation-3 p-[2.75rem]">
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
        <h1 className="text-headline-md font-bold text-neutral-800">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-neutral-600 text-center">
          We sent a verification code to your email. Enter it below to verify your account.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-full bg-error/5 border border-error/20 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-full bg-success/5 border border-success/20 px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label
            htmlFor="verify-email"
            className="block text-sm font-medium text-neutral-600 mb-1.5"
          >
            Email
          </label>
          <input
            id="verify-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-neutral border-b border-neutral-300/30 focus:border-primary rounded-full px-3 py-2.5 text-base text-neutral-800 placeholder:text-neutral-500 outline-none transition-colors duration-200"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-neutral-600 mb-1.5"
          >
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
            className="w-full bg-neutral border-b border-neutral-300/30 focus:border-primary rounded-full px-3 py-2.5 text-base text-neutral-800 placeholder:text-neutral-500 outline-none transition-colors duration-200 tracking-[0.3em] text-center text-lg"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-sm text-primary hover:bg-neutral-100 disabled:opacity-50"
        >
          {isResending ? 'Sending...' : "Didn't receive a code? Resend"}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-600">
        <Link href="/auth/signin" className="text-primary hover:underline font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
