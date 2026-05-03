import { ResponsiveShell } from '@/components/layout/ResponsiveShell';

/**
 * Studio route layout.
 *
 * Wraps the studio tree in the shared ResponsiveShell so the design studio
 * inherits the global top-bar (logo / blog / Pro / account / user menu).
 *
 * `variant="studio"` hides the vertical rail and gives the studio canvas a
 * full-bleed main area — the studio's internal `StudioTopBar`, `Toolbar`,
 * `ContextPanel`, and `BottomBar` own the interior layout.
 *
 * Auth is handled by middleware.ts (redirects unauthenticated /studio
 * requests to /design-studio), so no duplicate gating is needed here.
 */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveShell variant="studio">{children}</ResponsiveShell>;
}
