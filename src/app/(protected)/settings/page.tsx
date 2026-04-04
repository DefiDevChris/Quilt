import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProfileEditForm } from '@/components/community/profiles/ProfileEditForm';
import { BillingSection } from '@/components/billing/BillingSection';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your QuiltCorgi profile, account settings, and billing.',
};

export default async function SettingsPage() {
  // Auth check is handled by (protected)/layout.tsx
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Settings</h1>
        <p className="text-secondary mt-1">Manage your profile, billing, and account.</p>
      </div>
      <ProfileEditForm />
      <hr className="border-outline-variant" />
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-6 bg-surface-container rounded w-32" />
            <div className="h-24 bg-surface-container rounded-xl" />
          </div>
        }
      >
        <BillingSection />
      </Suspense>
      <hr className="border-outline-variant" />
      <DeleteAccountSection />
    </div>
  );
}
