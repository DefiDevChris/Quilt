import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProfileEditForm } from '@/components/community/profiles/ProfileEditForm';

export const metadata: Metadata = {
  title: 'Edit Profile | QuiltCorgi',
  description: 'Update your QuiltCorgi profile, avatar, and social links.',
};

export default async function ProfileEditPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return <ProfileEditForm />;
}
