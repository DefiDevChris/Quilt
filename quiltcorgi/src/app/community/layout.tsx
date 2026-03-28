import { ResponsiveCommunityShell } from '@/components/layout/ResponsiveCommunityShell';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveCommunityShell>{children}</ResponsiveCommunityShell>;
}
