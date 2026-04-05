'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AuthFormInner } from './AuthFormInner';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === 'signup';

  return (
    <div className="w-full max-w-[420px] mx-auto glass-elevated rounded-2xl p-[2.75rem]">
      {/* Logo + Heading */}
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="w-16 h-16 mb-4 relative block">
          <Image
            src="/logo.png"
            alt="QuiltCorgi — Back to home"
            fill
            sizes="64px"
            className="object-contain"
            priority
          />
        </Link>
        <h1 className="text-headline-md font-bold text-on-surface">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>

      <AuthFormInner mode={mode} />

      <p className="mt-6 text-center text-body-sm text-secondary">
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <Link
              href="/auth/signin"
              className="text-[color:var(--color-primary-dark)] hover:underline font-medium"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-[color:var(--color-primary-dark)] hover:underline font-medium"
            >
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
