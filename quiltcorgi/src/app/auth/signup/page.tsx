import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Sign Up — QuiltCorgi',
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-surface">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
