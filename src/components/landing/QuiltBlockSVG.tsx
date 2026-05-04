export default function QuiltBlockSVG({ className }: { className?: string }) {
  // A geometric quilt block – half-square triangles
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 0 L24 24 L0 48 Z" fill="currentColor" opacity="0.15" />
      <path d="M24 24 L48 0 L48 48 Z" fill="currentColor" opacity="0.1" />
      <path d="M0 0 L48 0 L24 24 Z" fill="currentColor" opacity="0.2" />
      <path d="M0 48 L48 48 L24 24 Z" fill="currentColor" opacity="0.05" />
      <path d="M24 24 L24 0" stroke="currentColor" strokeWidth="0.5" />
      <path d="M24 24 L0 24" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}
