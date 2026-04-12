import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Sign Up — QuiltCorgi',
};

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="h-8 w-8 animate-pulse rounded-lg bg-secondary" />
      }
    >
      <AuthForm mode="signup" />
    </Suspense>
  );
}
