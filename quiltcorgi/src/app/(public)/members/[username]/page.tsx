import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userProfiles } from '@/db/schema';
import { UserProfilePage } from '@/components/community/profiles/UserProfilePage';

interface MemberPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { username } = await params;

  const [profile] = await db
    .select({
      displayName: userProfiles.displayName,
      bio: userProfiles.bio,
      avatarUrl: userProfiles.avatarUrl,
    })
    .from(userProfiles)
    .where(eq(userProfiles.username, username))
    .limit(1);

  const name = profile?.displayName ?? username;
  const description = profile?.bio ?? `View ${name}'s quilting designs on QuiltCorgi.`;

  return {
    title: `${name} on QuiltCorgi`,
    description,
    openGraph: {
      title: `${name} on QuiltCorgi`,
      description,
      images: profile?.avatarUrl ? [{ url: profile.avatarUrl }] : undefined,
      type: 'profile',
    },
  };
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { username } = await params;

  return <UserProfilePage username={username} />;
}
