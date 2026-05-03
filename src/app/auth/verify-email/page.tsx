import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export const metadata: Metadata = {
  title: 'Verify Email — QuiltCorgi',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="h-8 w-8 animate-pulse rounded-lg bg-secondary" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
