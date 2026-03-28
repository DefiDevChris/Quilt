import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Sign In — QuiltCorgi',
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-surface">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />}>
        <AuthForm mode="signin" />
      </Suspense>
    </main>
  );
}
