'use client';

import { StudioGate } from '@/components/mobile/StudioGate';

export function StudioMobileGate() {
  return (
    <div className="md:hidden">
      <StudioGate />
    </div>
  );
}
