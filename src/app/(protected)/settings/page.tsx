'use client';

import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';
import { PageHeader } from '@/components/ui/PageHeader';

export default function SettingsPage() {
  return (
    <>
      <div className="relative">
        <PageHeader
          label="Account"
          title="Settings"
          description="Manage your account."
        />
        <div className="absolute top-0 right-0 w-20 h-20 opacity-10 pointer-events-none hidden lg:block">
          <img
            src="/icons/quilt-settings.png"
            alt="Settings"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-7 space-y-10">
          <hr className="border-[var(--color-border)]" />
          <DeleteAccountSection />
        </section>
      </div>
    </>
  );
}
