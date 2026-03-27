interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function WorktablesIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      {/* Three overlapping worktable layers */}
      <rect x="8" y="18" width="24" height="24" rx="4" fill="var(--color-primary-container)" />
      <rect x="20" y="12" width="24" height="24" rx="4" fill="var(--color-primary)" opacity="0.3" />
      <rect x="32" y="22" width="24" height="24" rx="4" fill="var(--color-primary-container)" stroke="var(--color-primary)" strokeWidth="1.5" />
      <line x1="38" y1="30" x2="50" y2="30" stroke="var(--color-primary)" strokeWidth="1.5" />
      <line x1="38" y1="35" x2="50" y2="35" stroke="var(--color-primary)" strokeWidth="1.5" />
      <line x1="38" y1="40" x2="46" y2="40" stroke="var(--color-primary)" strokeWidth="1.5" />
    </svg>
  );
}

function BlocksIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      {/* Grid of small blocks representing the library */}
      <rect x="10" y="10" width="12" height="12" rx="2" fill="var(--color-primary-container)" />
      <rect x="26" y="10" width="12" height="12" rx="2" fill="var(--color-primary)" opacity="0.25" />
      <rect x="42" y="10" width="12" height="12" rx="2" fill="var(--color-primary-container)" />
      <rect x="10" y="26" width="12" height="12" rx="2" fill="var(--color-primary)" opacity="0.25" />
      <rect x="26" y="26" width="12" height="12" rx="2" fill="var(--color-primary-container)" />
      <rect x="42" y="26" width="12" height="12" rx="2" fill="var(--color-primary)" opacity="0.25" />
      <rect x="10" y="42" width="12" height="12" rx="2" fill="var(--color-primary-container)" />
      <rect x="26" y="42" width="12" height="12" rx="2" fill="var(--color-primary)" opacity="0.25" />
      <rect x="42" y="42" width="12" height="12" rx="2" fill="var(--color-primary-container)" />
      {/* Search magnifier overlay */}
      <circle cx="46" cy="46" r="8" fill="var(--color-primary)" opacity="0.15" />
      <circle cx="44" cy="44" r="5" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" />
      <line x1="48" y1="48" x2="52" y2="52" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      {/* Document with grid lines */}
      <rect x="14" y="8" width="36" height="48" rx="4" fill="var(--color-primary-container)" />
      <rect x="14" y="8" width="36" height="48" rx="4" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" />
      {/* Grid pattern representing 1:1 scale */}
      <line x1="26" y1="8" x2="26" y2="56" stroke="var(--color-primary)" strokeWidth="0.75" opacity="0.3" />
      <line x1="38" y1="8" x2="38" y2="56" stroke="var(--color-primary)" strokeWidth="0.75" opacity="0.3" />
      <line x1="14" y1="20" x2="50" y2="20" stroke="var(--color-primary)" strokeWidth="0.75" opacity="0.3" />
      <line x1="14" y1="32" x2="50" y2="32" stroke="var(--color-primary)" strokeWidth="0.75" opacity="0.3" />
      <line x1="14" y1="44" x2="50" y2="44" stroke="var(--color-primary)" strokeWidth="0.75" opacity="0.3" />
      {/* 1:1 label */}
      <rect x="22" y="24" width="20" height="14" rx="2" fill="var(--color-primary)" opacity="0.15" />
      <text x="32" y="34" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="600">1:1</text>
    </svg>
  );
}

const features: FeatureCard[] = [
  {
    title: 'Three Worktables',
    description:
      'Quilt, Block, and Image worktables give you dedicated spaces for layout design, precision block drafting, and fabric scan processing.',
    icon: <WorktablesIcon />,
  },
  {
    title: '6,000+ Blocks',
    description:
      'A searchable library of traditional and modern quilt blocks. Filter by category, search by name, and drag directly onto your canvas.',
    icon: <BlocksIcon />,
  },
  {
    title: '1:1 PDF Printing',
    description:
      'Export patterns at true scale with seam allowances. Print, cut, and sew with confidence — no scaling math required.',
    icon: <PrintIcon />,
  },
];

export default function FeatureHighlights() {
  return (
    <section id="features" className="py-[5.5rem] bg-surface px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-[2rem] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface text-center mb-12">
          Everything EQ8 does. In your browser.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-surface-container rounded-[var(--radius-lg)] p-[1.4rem]"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-[1.25rem] font-medium text-on-surface mb-2">
                {feature.title}
              </h3>
              <p className="text-[0.875rem] text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
