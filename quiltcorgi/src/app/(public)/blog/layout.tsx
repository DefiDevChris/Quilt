import { SocialLayout } from '@/components/social/SocialLayout';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocialLayout activeSection="blog" contentClassName="pb-10 max-w-4xl mx-auto">
      {children}
    </SocialLayout>
  );
}
