import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProfileEditForm } from '@/components/community/profiles/ProfileEditForm';
import { BillingSection } from '@/components/billing/BillingSection';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';

export const metadata: Metadata = {
  title: 'Settings | QuiltCorgi',
  description: 'Manage your QuiltCorgi profile, account settings, and billing.',
};

export default async function SettingsPage() {
  // Auth check is handled by (protected)/layout.tsx
  return (
    <div className="max-w-xl mx-auto space-y-10">
      <ProfileEditForm />
      <hr className="border-outline-variant" />
      <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
        <BillingSection />
      </Suspense>
      <hr className="border-outline-variant" />
      <DeleteAccountSection />
    </div>
  );
}
