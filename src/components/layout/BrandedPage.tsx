import { ReactNode } from 'react';
import Mascot from '@/components/landing/Mascot';
import { QuiltPiece } from '@/components/decorative/QuiltPiece';
import { DECORATION, MASCOT } from '@/lib/design-system';

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
 * Adds: QuiltPiece background decorations + optional mascot decorations.
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
  decorationOpacity = DECORATION.defaultOpacity,
  showMascots = false,
  mascotCount = 1,
  className = '',
}: BrandedPageProps) {
  const mascotConfigs = MASCOT.positions[mascotCount];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background decorations — subtle, non-intrusive QuiltPiece elements */}
      {DECORATION.quiltPieceBackgrounds.map((cfg, i) => (
        <QuiltPiece
          key={i}
          color={cfg.color}
          size={cfg.size}
          rotation={cfg.rotation}
          {...cfg.position}
          opacity={decorationOpacity * (cfg.opacity / DECORATION.defaultOpacity)}
          strokeWidth={cfg.strokeWidth}
          stitchGap={cfg.stitchGap}
          stitchColor={DECORATION.stitchColor}
        />
      ))}

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
