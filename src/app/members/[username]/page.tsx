import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userProfiles } from '@/db/schema';
import { UserProfilePage } from '@/components/community/profiles/UserProfilePage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getProfileMeta(username: string) {
  try {
    const [profile] = await db
      .select({
        displayName: userProfiles.displayName,
        bio: userProfiles.bio,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(userProfiles)
      .where(eq(userProfiles.username, username))
      .limit(1);
    return profile ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const meta = await getProfileMeta(username);

  if (!meta) {
    return {
      title: 'Member — QuiltCorgi',
      description: 'View a quilter on QuiltCorgi.',
    };
  }

  return {
    title: `${meta.displayName} (@${username}) — QuiltCorgi`,
    description: meta.bio || `View ${meta.displayName}'s quilts and projects on QuiltCorgi.`,
    openGraph: {
      title: `${meta.displayName} — QuiltCorgi`,
      description: meta.bio ?? undefined,
      images: meta.avatarUrl ? [{ url: meta.avatarUrl }] : undefined,
      type: 'profile',
    },
  };
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { username } = await params;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <UserProfilePage username={username} />
    </div>
  );
}
