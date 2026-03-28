import { ResponsivePublicShell } from '@/components/layout/ResponsivePublicShell';

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return <ResponsivePublicShell maxWidth="max-w-4xl">{children}</ResponsivePublicShell>;
}
