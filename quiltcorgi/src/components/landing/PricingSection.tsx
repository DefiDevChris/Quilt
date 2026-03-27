import Link from 'next/link';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'text-success shrink-0'}
      aria-hidden="true"
    >
      <polyline points="2 8 6 12 14 4" />
    </svg>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon />
      <span className="text-secondary text-sm">{children}</span>
    </li>
  );
}

const freeFeatures = [
  'Up to 3 projects',
  '100 quilt blocks',
  'Basic drawing tools',
  'Fraction calculator',
  'Community browsing',
];

const proFeatures = [
  'Everything in Free, plus:',
  'Unlimited projects',
  'Full block library (6,000+)',
  'Custom block drafting',
  'Fabric upload and preview',
  'Layout presets',
  'Symmetry and serendipity tools',
  'Yardage calculator',
  '1:1 PDF export',
  'Share to community',
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-[5.5rem] bg-background px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-[2rem] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface text-center mb-12">
          Simple, transparent pricing
        </h2>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
          {/* Free Card */}
          <div className="flex-1 bg-surface-container rounded-[var(--radius-xl)] p-[2.75rem]">
            <h3 className="text-[1.5rem] font-semibold text-on-surface mb-1">
              Free
            </h3>
            <p className="text-secondary text-sm mb-6">Free forever</p>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((feature) => (
                <FeatureItem key={feature}>{feature}</FeatureItem>
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="block text-center bg-surface-container-high text-on-surface font-medium py-3 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
            >
              Start Free
            </Link>
          </div>

          {/* Pro Card */}
          <div className="flex-1 bg-surface-container-high rounded-[var(--radius-xl)] p-[2.75rem] relative overflow-hidden">
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary-container" />

            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[1.5rem] font-semibold text-on-surface">
                Pro
              </h3>
              <span className="inline-block bg-primary-container text-primary-on-container text-xs font-semibold px-2.5 py-0.5 rounded-full">
                PRO
              </span>
            </div>
            <p className="text-3xl font-bold text-on-surface mb-1">
              $9.99
              <span className="text-base font-normal text-secondary">/month</span>
            </p>
            <p className="text-secondary text-sm mb-6">Cancel anytime</p>
            <ul className="space-y-3 mb-8">
              {proFeatures.map((feature) => (
                <FeatureItem key={feature}>{feature}</FeatureItem>
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="block text-center bg-primary text-primary-on font-medium py-3 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
            >
              Start Pro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
