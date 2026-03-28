import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password — QuiltCorgi',
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-surface">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
