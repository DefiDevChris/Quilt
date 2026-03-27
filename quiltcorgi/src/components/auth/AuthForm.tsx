'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/ToastProvider';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

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
        const res = await fetch('/api/auth/register', {
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
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
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

  function handleGoogleSignIn() {
    signIn('google', { callbackUrl });
  }

  function handleComingSoon() {
    toast({
      title: 'Coming soon',
      description: 'This sign-in method will be available soon.',
      type: 'info',
    });
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
            <path d="M4 18 L12 4 L20 14" fill="#ffca9d" stroke="#8d4f00" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M44 18 L36 4 L28 14" fill="#ffca9d" stroke="#8d4f00" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="24" cy="32" r="1.5" fill="#383831" />
          </svg>
        </div>
        <h1 className="text-[length:var(--font-size-headline-md)] font-bold text-on-surface">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>

      {/* Social Login Buttons */}
      <div className="flex flex-col gap-[0.7rem] mb-6">
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant/15 rounded-md px-4 py-3 text-[length:var(--font-size-body-md)] font-medium text-on-surface hover:bg-surface-container-low transition-colors duration-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Facebook */}
        <button
          type="button"
          onClick={handleComingSoon}
          className="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant/15 rounded-md px-4 py-3 text-[length:var(--font-size-body-md)] font-medium text-on-surface hover:bg-surface-container-low transition-colors duration-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" fill="#1877F2" />
          </svg>
          Continue with Facebook
        </button>

        {/* Apple */}
        <button
          type="button"
          onClick={handleComingSoon}
          className="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant/15 rounded-md px-4 py-3 text-[length:var(--font-size-body-md)] font-medium text-on-surface hover:bg-surface-container-low transition-colors duration-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.64-2.2.52-3.06-.4C3.79 16.17 4.36 9.02 8.7 8.76c1.23.07 2.08.72 2.8.76.99-.2 1.94-.78 3.01-.7 1.28.1 2.24.59 2.88 1.49-2.63 1.57-2.01 5.02.36 5.99-.45 1.18-.99 2.35-1.7 3.98zM12.03 8.7c-.1-2.35 1.88-4.39 4.08-4.56.29 2.61-2.36 4.65-4.08 4.56z" fill="#383831" />
          </svg>
          Continue with Apple
        </button>

        {/* X */}
        <button
          type="button"
          onClick={handleComingSoon}
          className="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant/15 rounded-md px-4 py-3 text-[length:var(--font-size-body-md)] font-medium text-on-surface hover:bg-surface-container-low transition-colors duration-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#383831" />
          </svg>
          Continue with X
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <hr className="border-outline-variant/[0.08]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-surface-container-low px-3 text-[length:var(--font-size-body-sm)] text-secondary">
            or
          </span>
        </div>
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
            <label htmlFor="name" className="block text-[length:var(--font-size-body-sm)] font-medium text-secondary mb-1.5">
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
          <label htmlFor="email" className="block text-[length:var(--font-size-body-sm)] font-medium text-secondary mb-1.5">
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
          <label htmlFor="password" className="block text-[length:var(--font-size-body-sm)] font-medium text-secondary mb-1.5">
            Password
          </label>
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
                <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l14 14M8.5 8.8a2.5 2.5 0 003.4 3.4" strokeLinecap="round" />
                  <path d="M6.3 6.6C4.5 7.8 3.2 9.5 2.5 10c1.5 2 4.2 5 7.5 5 1.3 0 2.5-.4 3.5-1M10 5c3.3 0 6 3 7.5 5-.4.6-1 1.4-1.7 2.1" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 5c3.3 0 6 3 7.5 5-1.5 2-4.2 5-7.5 5s-6-3-7.5-5C4 8 6.7 5 10 5z" />
                  <circle cx="10" cy="10" r="2.5" />
                </svg>
              )}
            </button>
          </div>
          {isSignUp && (
            <p className="mt-1.5 text-[length:var(--font-size-body-sm)] text-secondary">
              Must be at least 8 characters
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
