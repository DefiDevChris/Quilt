import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

interface AuthPageShellProps {
  mode: 'signin' | 'signup';
}

export function AuthPageShell({ mode }: AuthPageShellProps) {
  return (
    <Suspense fallback={<div className="h-8 w-8 animate-pulse rounded-lg bg-secondary" />}>
      <AuthForm mode={mode} />
    </Suspense>
  );
}
