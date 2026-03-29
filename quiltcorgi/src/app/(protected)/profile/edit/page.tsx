import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/cognito-session';
import { ProfileEditForm } from '@/components/community/profiles/ProfileEditForm';

export const metadata: Metadata = {
  title: 'Edit Profile | QuiltCorgi',
  description: 'Update your QuiltCorgi profile, avatar, and social links.',
};

export default async function ProfileEditPage() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('qc_id_token')?.value;
  const user = idToken ? await verifySessionToken(idToken) : null;

  if (!user) {
    redirect('/auth/signin');
  }

  return <ProfileEditForm />;
}
