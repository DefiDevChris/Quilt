import { ReactNode } from 'react';
import Mascot from '@/components/landing/Mascot';
import { MASCOT } from '@/lib/design-system';

interface BrandedPageProps {
  children: ReactNode;
  /** Opacity level for background decorations (0-100). Defaults to design-system value. */
  decorationOpacity?: number;
  /** Whether to show mascot decorations. Defaults to false. */
  showMascots?: boolean;
  /** Number of mascots to show (1-3). Defaults to 1. */
  mascotCount?: 1 | 2 | 3;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * Wrapper component that adds QuiltCorgi decorative branding to page content areas.
 *
 * Does NOT include the logo — that comes from AppShell/PublicNav via route group layouts.
 * Adds: optional mascot decorations.
 *
 * Usage:
 *   <BrandedPage>
 *     <PageHeader title="Projects" />
 *     <ProjectGrid />
 *   </BrandedPage>
 *
 *   <BrandedPage showMascots mascotCount={2}>
 *     <PageHeader title="Fabrics" />
 *     <FabricGrid />
 *   </BrandedPage>
 */
export function BrandedPage({
  children,
  decorationOpacity = 0,
  showMascots = false,
  mascotCount = 1,
  className = '',
}: BrandedPageProps) {
  const mascotConfigs = MASCOT.positions[mascotCount];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Mascot decorations — optional, positioned in corners/negative space */}
      {showMascots &&
        mascotConfigs.map((mc, i) => (
          <div
            key={i}
            className="absolute z-20 pointer-events-none select-none"
            style={{
              ...mc.position,
              opacity: mc.opacity,
            }}
          >
            <Mascot pose={mc.pose} size={mc.size} />
          </div>
        ))}

      {/* Content layer — sits above decorations */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
