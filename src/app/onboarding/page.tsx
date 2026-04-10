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
        <div className="h-8 w-8 animate-pulse rounded-lg bg-[#ffc8a6]" />
      }
    >
      <OnboardingForm />
    </Suspense>
  );
}
