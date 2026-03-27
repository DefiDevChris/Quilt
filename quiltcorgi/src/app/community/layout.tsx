import { CommunityNav } from '@/components/community/CommunityNav';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <CommunityNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
