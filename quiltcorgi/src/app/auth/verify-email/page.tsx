import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export const metadata: Metadata = {
  title: 'Verify Email — QuiltCorgi',
};

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-surface">
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
