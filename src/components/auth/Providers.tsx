'use client';

import { SessionSync } from './SessionSync';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionSync>{children}</SessionSync>;
}
