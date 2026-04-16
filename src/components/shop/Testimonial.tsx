'use client';

import { COLORS } from '@/lib/design-system';

export default function Testimonial() {
  return (
    <section className="py-24" style={{ backgroundColor: `${COLORS.secondary}33` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          <div className="w-full md:w-1/2">
            {/* Stars */}
            <div className="flex space-x-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 fill-current"
                  style={{ color: COLORS.primary }}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p
              className="text-2xl md:text-3xl leading-relaxed mb-8"
              style={{
                fontFamily: 'var(--font-display)',
                color: COLORS.text,
              }}
            >
              &ldquo;The quality of the precuts made piecing so much faster&mdash;and the colors are
              even prettier in person. I get compliments on my quilts everywhere I go!&rdquo;
            </p>

            <p className="text-base mb-8" style={{ color: COLORS.textDim }}>
              <span className="font-semibold" style={{ color: COLORS.text }}>
                Amber R.
              </span>
              <span className="mx-2">·</span>
              Quilter since 2019
            </p>
            <a
              href="#fabrics"
              className="inline-block px-8 py-3 rounded-full font-semibold transition-colors shadow-sm text-base"
              style={{
                backgroundColor: COLORS.text,
                color: COLORS.surface,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.text;
              }}
            >
              Shop the collection
            </a>
          </div>
          <div className="w-full md:w-1/2">
            <div
              className="aspect-square rounded-lg overflow-hidden shadow-sm"
              style={{ backgroundColor: `${COLORS.primary}10` }}
            >
              <img
                src="/images/shop/fabric-by-yard.jpg"
                alt="Quilti Maker's Tote with sewing supplies"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
