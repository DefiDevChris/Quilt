import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Sign In — QuiltCorgi',
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="h-8 w-8 animate-pulse rounded-lg bg-[#ffc8a6]" />
      }
    >
      <AuthForm mode="signin" />
    </Suspense>
  );
}
