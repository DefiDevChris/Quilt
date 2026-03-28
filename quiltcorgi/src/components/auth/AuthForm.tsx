'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl') ?? '/dashboard';
  // Prevent open redirect: only allow relative paths starting with /
  const callbackUrl =
    rawCallback.startsWith('/') && !rawCallback.startsWith('//') ? rawCallback : '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSignUp = mode === 'signup';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const res = await fetch('/api/auth/cognito/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Registration failed');
          setIsLoading(false);
          return;
        }

        // Redirect to verification page
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      // Sign in
      const res = await fetch('/api/auth/cognito/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'UNVERIFIED') {
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(data.error ?? 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] mx-auto bg-surface-container-low rounded-xl shadow-elevation-2 p-[2.75rem]">
      {/* Logo + Heading */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 mb-4">
          <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
            <rect x="4" y="12" width="40" height="28" rx="6" fill="#ffca9d" />
            <ellipse cx="17" cy="24" rx="4" ry="4.5" fill="#8d4f00" />
            <ellipse cx="31" cy="24" rx="4" ry="4.5" fill="#8d4f00" />
            <ellipse cx="17" cy="23.5" rx="1.5" ry="2" fill="#fff6f1" />
            <ellipse cx="31" cy="23.5" rx="1.5" ry="2" fill="#fff6f1" />
            <ellipse cx="24" cy="30" rx="3" ry="2" fill="#8d4f00" />
            <path
              d="M4 18 L12 4 L20 14"
              fill="#ffca9d"
              stroke="#8d4f00"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M44 18 L36 4 L28 14"
              fill="#ffca9d"
              stroke="#8d4f00"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="32" r="1.5" fill="#383831" />
          </svg>
        </div>
        <h1 className="text-[length:var(--font-size-headline-md)] font-bold text-on-surface">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-sm bg-error/10 border border-error/20 px-4 py-3 text-[length:var(--font-size-body-sm)] text-error">
          {error}
        </div>
      )}

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label
              htmlFor="name"
              className="block text-[length:var(--font-size-body-sm)] font-medium text-secondary mb-1.5"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary rounded-t-sm px-3 py-2.5 text-[length:var(--font-size-body-md)] text-on-surface placeholder:text-secondary/60 outline-none transition-colors duration-200"
              placeholder="Your name"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-[length:var(--font-size-body-sm)] font-medium text-secondary mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary rounded-t-sm px-3 py-2.5 text-[length:var(--font-size-body-md)] text-on-surface placeholder:text-secondary/60 outline-none transition-colors duration-200"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-[length:var(--font-size-body-sm)] font-medium text-secondary"
            >
              Password
            </label>
            {!isSignUp && (
              <Link
                href="/auth/forgot-password"
                className="text-[length:var(--font-size-body-sm)] text-primary hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary rounded-t-sm px-3 py-2.5 pr-10 text-[length:var(--font-size-body-md)] text-on-surface placeholder:text-secondary/60 outline-none transition-colors duration-200"
              placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-on-surface transition-colors"
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
          {isSignUp && (
            <p className="mt-1.5 text-[length:var(--font-size-body-sm)] text-secondary">
              Must include uppercase, lowercase, and numbers
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-on rounded-md px-4 py-3 text-[length:var(--font-size-body-md)] font-medium hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? isSignUp
              ? 'Creating account...'
              : 'Signing in...'
            : isSignUp
              ? 'Create Account'
              : 'Sign In'}
        </button>
      </form>

      {/* Footer Link */}
      <p className="mt-6 text-center text-[length:var(--font-size-body-sm)] text-secondary">
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
