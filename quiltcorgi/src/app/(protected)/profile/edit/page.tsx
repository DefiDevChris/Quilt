import type { Metadata } from 'next';
import { ProfileEditForm } from '@/components/community/profiles/ProfileEditForm';

export const metadata: Metadata = {
  title: 'Edit Profile | QuiltCorgi',
  description: 'Update your QuiltCorgi profile, avatar, and social links.',
};

export default async function ProfileEditPage() {
  // Auth check is handled by (protected)/layout.tsx
  return <ProfileEditForm />;
}
