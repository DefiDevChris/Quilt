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
    <div className="w-full max-w-[500px] mx-auto bg-surface border border-default rounded-lg p-[2.75rem] relative">
      {/* Logo + Brand + Heading */}
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="w-24 h-24 mb-3 relative block">
          <Image
            src="/logo.png"
            alt="QuiltCorgi — Back to home"
            fill
            sizes="96px"
            className="object-contain"
            priority
          />
        </Link>
        <span
          className="text-2xl font-bold text-default mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          QuiltCorgi
        </span>
        <h1 className="text-headline-sm font-semibold text-secondary">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>

      <AuthFormInner mode={mode} />

      <p className="mt-6 text-center text-body-md font-medium text-secondary">
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-accent hover:underline font-medium">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
