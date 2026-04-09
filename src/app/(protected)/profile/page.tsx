import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { userProfiles } from '@/db/schema';
import { UserProfilePage } from '@/components/community/profiles/UserProfilePage';

export const metadata: Metadata = {
  title: 'My Profile',
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

  return (
    <div className="max-w-4xl mx-auto">
      <UserProfilePage username={profile.username} />
    </div>
  );
}
