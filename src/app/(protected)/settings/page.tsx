'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';
import { PageHeader } from '@/components/ui/PageHeader';
import { COLORS } from '@/lib/design-system';

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
          <Image src="/icons/quilt-settings.png" alt="Settings" fill className="object-contain" unoptimized />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-7 space-y-10">
          <hr style={{ borderColor: COLORS.border }} />
          <DeleteAccountSection />
        </section>
      </div>
    </>
  );
}
