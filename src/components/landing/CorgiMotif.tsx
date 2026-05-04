export default function CorgiMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path d="M12 36 C12 36 14 20 24 20 C34 20 36 36 36 36" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="24" r="2" fill="var(--color-text-dim)" />
      <circle cx="30" cy="24" r="2" fill="var(--color-text-dim)" />
      <path d="M24 28 L24 30 M22 30 L26 30" stroke="var(--color-text-dim)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 36 C8 44 12 48 24 48 C36 48 40 44 36 36" stroke="var(--color-primary)" strokeWidth="2" fill="none" />
    </svg>
  );
}
