import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <PublicNav />
      <main className="flex-grow w-full flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
