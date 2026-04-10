import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-surface-container border-t border-neutral-200">
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
                className="text-xl font-bold text-on-surface"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                QuiltCorgi
              </span>
            </div>
            <p className="text-on-surface/70 text-sm leading-relaxed max-w-xs">
              Design your quilts, calculate your yardage, and print patterns ready for the sewing
              room. A growing block library, and a community of quilters who get it.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="font-bold text-on-surface mb-4 text-sm uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Product
            </h4>
            <ul className="space-y-3 text-on-surface/70 text-sm">
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Design Studio
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Yardage Calculator
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4
              className="font-bold text-on-surface mb-4 text-sm uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Social
            </h4>
            <ul className="space-y-3 text-on-surface/70 text-sm">
              <li>
                <Link href="/socialthreads" className="hover:text-primary transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/socialthreads" className="hover:text-primary transition-colors">
                  Discussions
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="font-bold text-on-surface mb-4 text-sm uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Company
            </h4>
            <ul className="space-y-3 text-on-surface/70 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-on-surface/50">&copy; 2026 QuiltCorgi. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-on-surface/50">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
