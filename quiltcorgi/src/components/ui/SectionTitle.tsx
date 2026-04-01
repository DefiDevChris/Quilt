export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-label-sm uppercase text-secondary tracking-[0.02em] font-medium mb-3">
      {children}
    </h3>
  );
}
