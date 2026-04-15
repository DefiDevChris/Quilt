'use client';

import Link from 'next/link';
import { Palette, ShoppingBag } from 'lucide-react';
import { QuiltPieceRow } from '@/components/decorative/QuiltPiece';
import Mascot from './Mascot';
import { COLORS, COLORS_HOVER, SHADOW, MOTION, RADIUS } from '@/lib/design-system';

function ProductCard({
  eyebrow,
  title,
  description,
  bullets,
  ctaLabel,
  ctaHref,
  icon,
  variant,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';

  return (
    <div
      className="flex flex-col h-full bg-[var(--color-surface)] border border-[var(--color-border)] p-8 lg:p-10"
      style={{
        borderRadius: RADIUS.lg,
        boxShadow: SHADOW.brand,
      }}
    >
      <div
        className="flex items-center justify-center w-14 h-14 mb-6"
        style={{
          backgroundColor: `${COLORS.primary}1a`,
          borderRadius: RADIUS.lg,
          color: COLORS.primary,
        }}
      >
        {icon}
      </div>

      <p
        className="text-xs font-bold tracking-widest uppercase mb-2"
        style={{ color: COLORS.primary }}
      >
        {eyebrow}
      </p>
      <h3
        className="text-2xl lg:text-3xl font-bold mb-4"
        style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
      >
        {title}
      </h3>
      <p className="text-base mb-6 leading-relaxed" style={{ color: COLORS.textDim }}>
        {description}
      </p>

      <ul className="space-y-2 mb-8 flex-1">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-3 text-sm"
            style={{ color: COLORS.text }}
          >
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS.primary }}
            />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-base text-center"
        style={{
          backgroundColor: isPrimary ? COLORS.primary : 'transparent',
          color: isPrimary ? COLORS.text : COLORS.primary,
          border: isPrimary ? 'none' : `2px solid ${COLORS.primary}`,
          transition: `background-color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}, color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
        }}
        onMouseEnter={(e) => {
          if (isPrimary) {
            e.currentTarget.style.backgroundColor = COLORS_HOVER.primary;
          } else {
            e.currentTarget.style.backgroundColor = `${COLORS.primary}1a`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isPrimary ? COLORS.primary : 'transparent';
        }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export default function DualIntentHero() {
  return (
    <section className="px-6 lg:px-12 pt-16 lg:pt-24 pb-20 lg:pb-28 bg-[var(--color-bg)] relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero headline */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="flex items-center justify-center gap-2 mb-6">
            <QuiltPieceRow count={5} size={10} gap={5} />
          </div>
          <h1
            className="text-[40px] leading-[48px] md:text-[56px] md:leading-[64px] lg:text-[64px] lg:leading-[72px] font-bold mb-6"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            Shop fabric.
            <span className="block" style={{ color: COLORS.primary }}>
              Design quilts.
            </span>
            All in one place.
          </h1>
          <p
            className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color: COLORS.textDim }}
          >
            QuiltCorgi pairs a curated fabric shop with a browser-based design studio — so your next
            quilt can start with a bolt, a block, or a blank canvas.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base"
              style={{
                backgroundColor: COLORS.primary,
                color: COLORS.text,
                boxShadow: SHADOW.brand,
                transition: `background-color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={2} />
              Shop Fabric
            </Link>
            <Link
              href="/design-studio"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base"
              style={{
                backgroundColor: 'transparent',
                color: COLORS.primary,
                border: `2px solid ${COLORS.primary}`,
                transition: `background-color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}, color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.primary}1a`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Palette className="w-5 h-5" strokeWidth={2} />
              Design a Quilt Free
            </Link>
          </div>
        </div>

        {/* Two product cards */}
        <div className="relative">
          <Mascot
            pose="wagging"
            size="md"
            className="absolute -top-8 -left-4 z-10 hidden lg:block"
          />
          <Mascot
            pose="fetching"
            size="md"
            className="absolute -bottom-8 -right-4 z-10 hidden lg:block"
          />

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <ProductCard
              variant="primary"
              icon={<ShoppingBag className="w-7 h-7" strokeWidth={1.75} />}
              eyebrow="The Shop"
              title="Fabric, precuts, and kits — curated for quilters."
              description="Browse fat quarters, jelly rolls, layer cakes, and curated kits from small-batch designers. Ship straight to your sewing room."
              bullets={[
                'Free shipping on orders over $50',
                'Curated collections refreshed monthly',
                'Fabrics you can drop straight into the studio',
              ]}
              ctaLabel="Browse the Shop"
              ctaHref="/shop"
            />
            <ProductCard
              variant="secondary"
              icon={<Palette className="w-7 h-7" strokeWidth={1.75} />}
              eyebrow="The Studio"
              title="Design your next quilt in your browser."
              description="Drag fabrics onto blocks, try layouts, and export true-scale PDF patterns with seam allowances built in. Free to start."
              bullets={[
                'Growing library of blocks and layouts',
                '1:1 PDF export with seam allowances',
                'Free tier forever — Pro unlocks saving and export',
              ]}
              ctaLabel="Open the Studio"
              ctaHref="/design-studio"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
