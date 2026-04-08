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
    <div className="space-y-10">
      <div className="mb-8">
        <p className="text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-2">
          Account
        </p>
        <h1 className="text-on-surface text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Settings
        </h1>
        <p className="text-secondary mt-1">Manage your profile, billing, and account.</p>
      </div>
      <div className="max-w-2xl">
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
    </div>
  );
}
