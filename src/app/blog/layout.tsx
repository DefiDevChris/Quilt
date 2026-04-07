import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7] selection:bg-[#c48a28]/20">
      <PublicNav />
      <main className="flex-grow w-full flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
