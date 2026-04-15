'use client';

import { COLORS, darkenHex } from '@/lib/design-system';

const quickLinks = [
  'New Fabrics',
  'Quilt Kits',
  'Precuts',
  'Patterns',
  'Thread',
  'Notions',
  'Gift Cards',
  'Sale',
];

export default function QuickLinks() {
  return (
    <section className="py-16 lg:py-20" style={{ backgroundColor: COLORS.bg }}>
      <div className="w-full px-6 lg:px-12">
        <h2
          className="text-2xl lg:text-3xl text-center mb-8"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            color: COLORS.text,
            fontStyle: 'italic',
          }}
        >
          Start sewing today
        </h2>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {quickLinks.map((link) => (
            <a
              key={link}
              href="#fabrics"
              className="px-6 py-2.5 text-sm font-medium rounded-full border transition-colors duration-200 bg-white"
              style={{
                borderColor: `${COLORS.text}1a`,
                color: COLORS.text,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
                e.currentTarget.style.color = COLORS.surface;
                e.currentTarget.style.borderColor = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.surface;
                e.currentTarget.style.color = COLORS.text;
                e.currentTarget.style.borderColor = `${COLORS.text}1a`;
              }}
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
