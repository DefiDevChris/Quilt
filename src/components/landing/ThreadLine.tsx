export default function ThreadLine({
  className,
  variation = 'vertical',
}: {
  className?: string;
  variation?: 'vertical' | 'curved';
}) {
  if (variation === 'curved') {
    return (
      <svg
        className={className}
        viewBox="0 0 48 120"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M24 0 C24 40 4 80 24 120"
          stroke="var(--color-primary)"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
        />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 2 48"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="1" y1="0" x2="1" y2="48"
        stroke="var(--color-primary)"
        strokeWidth="1"
        strokeDasharray="3 6"
      />
    </svg>
  );
}
