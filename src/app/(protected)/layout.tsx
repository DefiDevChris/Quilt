import { ResponsiveShell } from '@/components/layout/ResponsiveShell';
import { BrandedPage } from '@/components/layout/BrandedPage';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <ResponsiveShell>
        <BrandedPage showMascots mascotCount={1}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <main className="min-w-0">{children}</main>
          </div>
        </BrandedPage>
      </ResponsiveShell>
    </div>
  );
}
