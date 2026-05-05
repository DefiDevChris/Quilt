'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AuthFormInner } from './AuthFormInner';
import { SocialLoginButtons } from './SocialLoginButtons';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === 'signup';

  return (
    <div className="auth-form-panel">
      <div className="auth-form-inner">
        {/* Heading */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <Link href="/" className="relative block w-14 h-14 shrink-0">
              <Image
                src="/logo.png"
                alt="QuiltCorgi — Back to home"
                fill
                sizes="56px"
                className="object-contain"
                priority
              />
            </Link>
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-[2rem] font-bold text-[var(--color-text)] leading-[1.1] tracking-tight">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h1>
                <p className="text-[var(--color-text-dim)] text-sm leading-relaxed max-w-sm">
                  {isSignUp
                    ? 'Start designing beautiful quilts today'
                    : 'Sign in to continue your quilting journey'}
                </p>
              </div>
            </div>
          </div>

          <AuthFormInner mode={mode} />

        {/* Social login */}
        <div className="auth-form-divider">
          <span className="auth-form-divider-text">or</span>
        </div>

        <SocialLoginButtons mode={mode} />

        {/* Divider */}
        <div className="auth-form-divider">
          <span className="auth-form-divider-text">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
        </div>

        <Link
          href={isSignUp ? '/auth/signin' : '/auth/signup'}
          className="auth-alt-btn"
        >
          {isSignUp ? 'Sign In' : 'Create Account'}
        </Link>

      </div>
    </div>
  );
}
