import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export default function TutorialsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="max-w-5xl mx-auto px-4 py-12 lg:py-16">{children}</main>
      <Footer />
    </>
  );
}
