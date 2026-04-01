import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { userProfiles } from '@/db/schema';
import { UserProfilePage } from '@/components/community/profiles/UserProfilePage';

export const metadata: Metadata = {
  title: 'My Profile | QuiltCorgi',
  description: 'View your QuiltCorgi profile and shared projects.',
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const [profile] = await db
    .select({ username: userProfiles.username })
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id))
    .limit(1);

  // Profile is always created during onboarding on first login
  return <UserProfilePage username={profile.username} />;
}
