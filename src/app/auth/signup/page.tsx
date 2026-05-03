import type { Metadata } from 'next';
import { AuthPageShell } from '../_components/AuthPageShell';

export const metadata: Metadata = {
  title: 'Sign Up — QuiltCorgi',
};

export default function SignUpPage() {
  return <AuthPageShell mode="signup" />;
}
