'use client';

import { Star } from 'lucide-react';
import { COLORS } from '@/lib/design-system';

export default function Testimonial() {
  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: COLORS.bg }}>
      <div className="w-full px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Quote */}
          <div className="order-2 lg:order-1">
            <span
              className="text-xs uppercase tracking-widest mb-4 block"
              style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
            >
              Maker Spotlight
            </span>

            <blockquote className="mb-8">
              <p
                className="text-2xl lg:text-3xl leading-relaxed mb-6"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  color: COLORS.text,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;The quality of the precuts made piecing so much faster—and
                the colors are even prettier in person.&rdquo;
              </p>
            </blockquote>

            {/* Stars */}
            <div className="flex space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-current"
                  style={{ color: COLORS.primary }}
                  strokeWidth={1.5}
                />
              ))}
            </div>

            {/* Attribution */}
            <div>
              <p className="font-medium" style={{ color: COLORS.text }}>
                Amber R.
              </p>
              <p className="text-sm" style={{ color: COLORS.textDim }}>
                Making with QuiltCorgi since 2021
              </p>
            </div>
          </div>

          {/* Portrait */}
          <div className="order-1 lg:order-2 relative">
            <div className="aspect-[4/5] rounded-[32px] overflow-hidden">
              <img
                src="/images/shop/hero-fabric-drapes.jpg"
                alt="Amber R. - QuiltCorgi Maker"
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
              className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full -z-10"
              style={{ backgroundColor: `${COLORS.accent}66`, filter: 'blur(40px)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
