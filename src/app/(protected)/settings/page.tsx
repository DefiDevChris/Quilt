import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProfileEditForm } from '@/components/community/profiles/ProfileEditForm';
import { BillingSection } from '@/components/billing/BillingSection';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your QuiltCorgi profile, account settings, and billing.',
};

export default async function SettingsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        label="Account"
        title="Settings"
        description="Manage your profile, billing, and account."
      />
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
