'use client';

import { ArrowRight } from 'lucide-react';
import { COLORS } from '@/lib/design-system';

export default function About() {
  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: COLORS.bg }}>
      <div className="w-full px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-[32px] overflow-hidden">
              <img
                src="/images/shop/fabric-shop-shelves.jpg"
                alt="QuiltCorgi team"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.style.backgroundColor = `${COLORS.primary}20`;
                }}
              />
            </div>
            {/* Decorative element */}
            <div
              className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full -z-10"
              style={{ backgroundColor: `${COLORS.primary}33`, filter: 'blur(40px)' }}
            />
          </div>

          {/* Content */}
          <div className="lg:pl-8">
            <span
              className="text-xs uppercase tracking-widest mb-4 block"
              style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
            >
              About QuiltCorgi
            </span>
            <h2
              className="text-4xl lg:text-5xl mb-6"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                color: COLORS.text,
                fontStyle: 'italic',
              }}
            >
              We&apos;re a small team with a big love for fabric.
            </h2>
            <p
              className="text-lg leading-relaxed mb-6"
              style={{ color: COLORS.textDim }}
            >
              QuiltCorgi started in a studio apartment and grew into a community of makers.
              We design prints, curate palettes, and ship orders with care—so you can
              focus on the fun part: sewing.
            </p>
            <p
              className="text-lg leading-relaxed mb-8"
              style={{ color: COLORS.textDim }}
            >
              Every fabric in our shop is chosen with intention. We believe quilting
              is more than a hobby—it&apos;s a way to create warmth, share stories, and
              connect with others.
            </p>
            <a
              href="#"
              className="inline-flex items-center text-sm font-medium transition-colors group"
              style={{ color: COLORS.text }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.text;
              }}
            >
              Read our story
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
