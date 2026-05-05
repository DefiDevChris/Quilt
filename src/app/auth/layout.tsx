import { AuthHeroPanel } from '@/components/auth/AuthHeroPanel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-page-inner">
        {children}
        <AuthHeroPanel />
      </div>
    </main>
  );
}
