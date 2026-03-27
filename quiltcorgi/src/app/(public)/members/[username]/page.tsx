import type { Metadata } from 'next';
import { UserProfilePage } from '@/components/community/profiles/UserProfilePage';

interface MemberPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `${username} on QuiltCorgi`,
    description: `View ${username}'s quilting projects and profile on QuiltCorgi.`,
  };
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { username } = await params;

  return <UserProfilePage username={username} />;
}
