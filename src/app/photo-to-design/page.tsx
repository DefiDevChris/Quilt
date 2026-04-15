import { redirect } from 'next/navigation';
import { getSession } from '@/lib/cognito-session';
import { isAdmin, isPro } from '@/lib/role-utils';
import { PhotoDesignApp } from './PhotoDesignApp';

/**
 * Rollout gate per docs/magic-wand/00-overview.md §Rollout.
 *
 * Stage 1 (internal): admin only — PHOTO_TO_DESIGN_ACCESS=internal (default).
 * Stage 2 (beta): opt-in Pro — PHOTO_TO_DESIGN_ACCESS=beta (admin + pro).
 * Stage 3 (GA): all Pro — PHOTO_TO_DESIGN_ACCESS=ga (any authenticated pro/admin).
 *
 * This file reads an env var rather than a dedicated feature-flag service
 * because this repo does not currently use GrowthBook / LaunchDarkly.
 */
export default async function PhotoToDesignPage() {
  const session = await getSession();
  if (!session?.user) redirect('/sign-in?next=/photo-to-design');

  const stage = (process.env.PHOTO_TO_DESIGN_ACCESS ?? 'internal').toLowerCase();
  const role = session.user.role;
  // isPro(role) already covers admin. During 'internal' rollout, admins only.
  const allowed = stage === 'internal' ? isAdmin(role) : isPro(role);

  if (!allowed) redirect('/studio');

  return <PhotoDesignApp />;
}
