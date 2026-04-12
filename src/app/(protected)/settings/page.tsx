import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProfileEditForm } from '@/components/community/profiles/ProfileEditForm';
import { BillingSection } from '@/components/billing/BillingSection';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';
import { PageHeader } from '@/components/ui/PageHeader';
import { BrandedPage } from '@/components/layout/BrandedPage';
import { COLORS } from '@/lib/design-system';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your Quilt Studio profile, account settings, and billing.',
};

export default async function SettingsPage() {
  return (
    <BrandedPage>
      <div className="space-y-10">
        <PageHeader
          label="Account"
          title="Settings"
          description="Manage your profile, billing, and account."
        />
        <div className="max-w-2xl">
          <ProfileEditForm />
          <hr style={{ borderColor: COLORS.border }} />
          <Suspense
            fallback={
              <div className="space-y-4 py-8">
                <div className="h-6 rounded-lg w-32" style={{ backgroundColor: COLORS.border }} />
                <div className="h-24 rounded-lg" style={{ backgroundColor: COLORS.border }} />
              </div>
            }
          >
            <BillingSection />
          </Suspense>
          <hr style={{ borderColor: COLORS.border }} />
          <DeleteAccountSection />
        </div>
      </div>
    </BrandedPage>
  );
}
