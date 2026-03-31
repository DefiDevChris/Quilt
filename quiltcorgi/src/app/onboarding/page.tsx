import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OnboardingForm } from '@/components/auth/OnboardingForm';

export const metadata: Metadata = {
  title: 'Set Up Your Account — QuiltCorgi',
};

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      }
    >
      <OnboardingForm />
    </Suspense>
  );
}
