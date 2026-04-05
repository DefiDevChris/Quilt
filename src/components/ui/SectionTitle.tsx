export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-label-sm uppercase text-on-surface/70 tracking-[0.06em] font-semibold mb-3">
      {children}
    </h3>
  );
}
