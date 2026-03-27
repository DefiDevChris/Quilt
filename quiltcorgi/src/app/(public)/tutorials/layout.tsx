import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export default function TutorialsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
