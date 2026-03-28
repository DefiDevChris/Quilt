import { ResponsivePublicShell } from '@/components/layout/ResponsivePublicShell';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <ResponsivePublicShell>{children}</ResponsivePublicShell>;
}
