import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/cognito-session';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';

/**
 * Studio route layout.
 *
 * Gates on session + wraps the studio tree in the shared ResponsiveShell so
 * the design studio inherits the new global top-bar (logo / blog / Pro /
 * account / user menu) instead of rendering the legacy chrome-only shell.
 *
 * `variant="studio"` hides the vertical rail and gives the studio canvas a
 * full-bleed main area — the studio's internal `StudioTopBar`, `Toolbar`,
 * `ContextPanel`, and `BottomBar` continue to own the interior layout.
 *
 * Auth flow is unchanged: DEV_AUTH_BYPASS short-circuits, otherwise we
 * verify the id_token cookie and redirect unauthenticated users back to
 * the marketing design-studio landing page.
 */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    return <ResponsiveShell variant="studio">{children}</ResponsiveShell>;
  }

  const cookieStore = await cookies();
  const idToken = cookieStore.get('qc_id_token')?.value;
  const user = idToken ? await verifySessionToken(idToken) : null;

  if (!user) {
    redirect('/design-studio');
  }

  return <ResponsiveShell variant="studio">{children}</ResponsiveShell>;
}
