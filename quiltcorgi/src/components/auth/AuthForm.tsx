'use client';

import Image from 'next/image';
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
        <div className="w-16 h-16 mb-4 relative">
          <Image src="/logo.png" alt="QuiltCorgi" fill className="object-contain" priority />
        </div>
        <h1 className="text-[length:var(--font-size-headline-md)] font-bold text-on-surface">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>

      <AuthFormInner mode={mode} />
    </div>
  );
}
