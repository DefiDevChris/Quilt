'use client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="max-w-4xl mx-auto mb-6">
        <h1 className="text-lg font-semibold text-primary">Moderation</h1>
      </nav>
      {children}
    </>
  );
}
