'use client';

import { COLORS } from '@/lib/design-system';

const footerLinks = {
  shop: [
    { name: 'New Arrivals', href: '#new' },
    { name: 'Fabrics', href: '#fabrics' },
    { name: 'Kits', href: '#kits' },
    { name: 'Patterns', href: '#patterns' },
    { name: 'Gift Cards', href: '#' },
  ],
  support: [
    { name: 'Shipping', href: '#' },
    { name: 'Returns', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'FAQ', href: '#' },
  ],
  company: [
    { name: 'About', href: '#about' },
    { name: 'Careers', href: '#' },
    { name: 'Privacy', href: '#' },
    { name: 'Terms', href: '#' },
  ],
};

export default function ShopFooter() {
  return (
    <footer
      className="py-16 lg:py-20 border-t"
      style={{
        backgroundColor: COLORS.bg,
        borderColor: `${COLORS.text}1a`,
      }}
    >
      <div className="w-full px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/shop" className="inline-block mb-4">
              <span
                className="text-3xl"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  color: COLORS.text,
                  fontStyle: 'italic',
                }}
              >
                QuiltCorgi
              </span>
            </a>
            <p className="mb-6 max-w-xs" style={{ color: COLORS.textDim }}>
              Stitch your next favorite quilt.
            </p>
            <div className="flex space-x-4">
              {/* Instagram */}
              <a
                href="#"
                className="p-2 transition-colors"
                style={{ color: `${COLORS.text}60` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = `${COLORS.text}60`;
                }}
                aria-label="Instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="#"
                className="p-2 transition-colors"
                style={{ color: `${COLORS.text}60` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = `${COLORS.text}60`;
                }}
                aria-label="Facebook"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="#"
                className="p-2 transition-colors"
                style={{ color: `${COLORS.text}60` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = `${COLORS.text}60`;
                }}
                aria-label="YouTube"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
            >
              Shop
            </h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="transition-colors"
                    style={{ color: COLORS.text }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = COLORS.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = COLORS.text;
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
            >
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="transition-colors"
                    style={{ color: COLORS.text }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = COLORS.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = COLORS.text;
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
            >
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="transition-colors"
                    style={{ color: COLORS.text }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = COLORS.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = COLORS.text;
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between"
          style={{ borderTop: `1px solid ${COLORS.text}1a` }}
        >
          <p className="text-sm" style={{ color: COLORS.textDim }}>
            &copy; {new Date().getFullYear()} QuiltCorgi. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 lg:mt-0">
            <a
              href="#"
              className="text-sm transition-colors"
              style={{ color: COLORS.textDim }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.textDim;
              }}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm transition-colors"
              style={{ color: COLORS.textDim }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.textDim;
              }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
