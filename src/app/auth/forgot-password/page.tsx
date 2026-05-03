import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password — QuiltCorgi',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="h-8 w-8 animate-pulse rounded-lg bg-secondary" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
