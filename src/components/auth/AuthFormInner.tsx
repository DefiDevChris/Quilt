'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface AuthFormInnerProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  compact?: boolean;
}

export function AuthFormInner({ mode, onSuccess, compact = false }: AuthFormInnerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl') ?? '/dashboard';
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

        // Dev bypass: skip email verification, go straight to onboarding
        if (data.data?.devMode) {
          router.push('/onboarding');
          router.refresh();
          return;
        }

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

      onSuccess?.();
      router.push(data.needsOnboarding ? '/onboarding' : callbackUrl);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  const inputClassName = compact
    ? 'w-full bg-default border-b border-default focus:border-primary rounded-lg px-3 py-2 text-sm text-default placeholder:text-dim outline-none transition-colors duration-150'
    : 'w-full bg-default border-b border-default focus:border-primary rounded-lg px-3 py-2.5 text-base text-default placeholder:text-dim outline-none transition-colors duration-150';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {isSignUp && (
        <div>
          <label
            htmlFor={compact ? 'modal-name' : 'name'}
            className="block text-base font-semibold text-default mb-1.5"
          >
            Name
          </label>
          <input
            id={compact ? 'modal-name' : 'name'}
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClassName}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
      )}

      <div>
        <label
          htmlFor={compact ? 'modal-email' : 'email'}
          className="block text-base font-semibold text-default mb-1.5"
        >
          Email
        </label>
        <input
          id={compact ? 'modal-email' : 'email'}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClassName}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={compact ? 'modal-password' : 'password'}
            className="block text-base font-semibold text-default"
          >
            Password
          </label>
          {!isSignUp && !compact && (
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <input
            id={compact ? 'modal-password' : 'password'}
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClassName} pr-10`}
            placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-dim hover:text-default transition-colors duration-150"
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
          <p className="mt-1.5 text-sm text-dim">
            Must include uppercase, lowercase, and numbers
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
