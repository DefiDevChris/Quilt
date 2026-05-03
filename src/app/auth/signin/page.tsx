import type { Metadata } from 'next';
import { AuthPageShell } from '../_components/AuthPageShell';

export const metadata: Metadata = {
  title: 'Sign In — QuiltCorgi',
};

export default function SignInPage() {
  return <AuthPageShell mode="signin" />;
}
