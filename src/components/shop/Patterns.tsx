'use client';

import { ArrowRight } from 'lucide-react';
import { COLORS } from '@/lib/design-system';

const patterns = [
  { id: 1, name: 'Garden Path Quilt Pattern', format: 'PDF', image: '/images/pattern-garden-path.jpg' },
  { id: 2, name: 'Flying Geese Pillow Set', format: 'Printed', image: '/images/pattern-geese-pillows.jpg' },
  { id: 3, name: 'Striped Table Runner', format: 'PDF', image: '/images/pattern-table-runner.jpg' },
];

export default function Patterns() {
  return (
    <section id="patterns" className="py-20 lg:py-28" style={{ backgroundColor: COLORS.bg }}>
      <div className="w-full px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
          <div>
            <span
              className="text-xs uppercase tracking-widest mb-3 block"
              style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
            >
              Fresh Patterns
            </span>
            <h2
              className="text-4xl lg:text-5xl"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                color: COLORS.text,
                fontStyle: 'italic',
              }}
            >
              New designs to try
            </h2>
          </div>
          <a
            href="/shop/catalog"
            className="inline-flex items-center mt-4 lg:mt-0 text-sm font-medium transition-colors group"
            style={{ color: COLORS.text }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.text;
            }}
          >
            Shop all patterns
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
          </a>
        </div>

        {/* Pattern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {patterns.map((pattern) => (
            <article
              key={pattern.id}
              className="group bg-white rounded-[28px] overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={pattern.image}
                  alt={pattern.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.style.backgroundColor = `${COLORS.primary}10`;
                  }}
                />
              </div>
              <div className="p-6">
                <h3
                  className="text-xl font-light mb-3"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: COLORS.text,
                  }}
                >
                  {pattern.name}
                </h3>
                <span
                  className={`inline-block px-3 py-1 text-xs uppercase tracking-wider rounded-full ${
                    pattern.format === 'PDF'
                      ? 'bg-primary/30'
                      : 'bg-accent/60'
                  }`}
                  style={{
                    backgroundColor: pattern.format === 'PDF' ? `${COLORS.primary}33` : `${COLORS.accent}66`,
                    color: COLORS.text,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {pattern.format}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
