'use client';

export function ProtectedPageShell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-5xl mx-auto md:pt-10 md:pb-12 relative z-10 w-full">{children}</div>;
}
