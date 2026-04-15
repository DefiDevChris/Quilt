'use client';

import { COLORS } from '@/lib/design-system';

const footerLinks = {
  resources: [
    'About Us',
    'Our Fabric',
    'Our Thread',
    'Learning Center',
    'Gift Cards',
  ],
  help: [
    'Contact Us',
    'My Account',
    'Orders',
    'Shipping',
    'Terms & Conditions',
  ],
};

export default function ShopFooter() {
  return (
    <footer
      className="pt-16 pb-8 border-t"
      style={{
        backgroundColor: COLORS.bg,
        borderColor: `${COLORS.text}1a`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a
              href="/shop"
              className="text-3xl font-bold block mb-6"
              style={{
                fontFamily: 'var(--font-display)',
                color: COLORS.primary,
                letterSpacing: '-0.02em',
              }}
            >
              QuiltCorgi
            </a>
            <p className="text-sm mb-6" style={{ color: COLORS.textDim }}>
              Join for product updates, special offers, and more from our team.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4
              className="font-bold uppercase text-sm tracking-wider mb-6"
              style={{ color: COLORS.text }}
            >
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((item) => (
                <li key={item}>
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
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4
              className="font-bold uppercase text-sm tracking-wider mb-6"
              style={{ color: COLORS.text }}
            >
              Help
            </h4>
            <ul className="space-y-3">
              {footerLinks.help.map((item) => (
                <li key={item}>
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
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="font-bold uppercase text-sm tracking-wider mb-6"
              style={{ color: COLORS.text }}
            >
              We&apos;re Here To Help!
            </h4>
            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ color: COLORS.textDim }}
            >
              Our customer service team members are real crafters who are as choosy as you are when it comes to their craft. We&apos;re here to make your quilting journey nothing short of amazing.
            </p>
            <a
              href="#"
              className="text-sm font-medium inline-block transition-colors"
              style={{ color: COLORS.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = darkenHex(COLORS.primary, 0.15);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t pt-8 flex flex-col md:flex-row justify-between items-center"
          style={{ borderColor: `${COLORS.text}1a` }}
        >
          <p className="text-xs mb-4 md:mb-0" style={{ color: COLORS.textDim }}>
            QuiltCorgi® &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function darkenHex(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
