import { ResponsiveShell } from '@/components/layout/ResponsiveShell';

/** Studio layout — full-bleed canvas, auth handled by middleware. */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveShell variant="studio">{children}</ResponsiveShell>;
}
