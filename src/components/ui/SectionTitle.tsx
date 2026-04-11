export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[var(--color-text-dim)] text-[14px] leading-[20px] font-semibold mb-3">
      {children}
    </h3>
  );
}
