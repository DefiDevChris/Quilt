import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[var(--color-bg)] border-t border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="QuiltCorgi Logo"
                width={40}
                height={40}
                unoptimized
                className="object-contain"
              />
              <span
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                QuiltCorgi
              </span>
            </div>
            <p className="text-[var(--color-text-dim)] text-sm leading-relaxed max-w-xs">
              Design your quilts, calculate your yardage, and print patterns ready for the sewing
              room. A growing block library, and a community of quilters who get it.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="font-bold text-[var(--color-text)] mb-4 text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Product
            </h4>
            <ul className="space-y-3 text-[var(--color-text-dim)] text-sm">
              <li>
                <Link
                  href="/design-studio"
                  className="hover:text-primary transition-colors duration-150"
                >
                  Design Studio
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors duration-150">
                  Shop
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4
              className="font-bold text-[var(--color-text)] mb-4 text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Resources
            </h4>
            <ul className="space-y-3 text-[var(--color-text-dim)] text-sm">
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors duration-150">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-primary transition-colors duration-150">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="font-bold text-[var(--color-text)] mb-4 text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Company
            </h4>
            <ul className="space-y-3 text-[var(--color-text-dim)] text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors duration-150">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors duration-150">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors duration-150">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors duration-150">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[var(--color-text-dim)]">
            &copy; 2026 QuiltCorgi. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-dim)]">
            <Link href="/privacy" className="hover:text-primary transition-colors duration-150">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors duration-150">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
