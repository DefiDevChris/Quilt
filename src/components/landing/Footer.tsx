import Link from 'next/link';
import Mascot from './Mascot';

export default function Footer() {
  return (
    <footer className="bg-warm-surface border-t border-warm-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Mascot pose="standing" size="sm" />
              <span
                className="text-xl font-bold text-warm-text"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                QuiltCorgi
              </span>
            </div>
            <p className="text-warm-text-secondary text-sm leading-relaxed max-w-xs">
              Turn photos into quilt patterns, design from scratch, calculate yardage, and print
              true-scale patterns — all in your browser. Free to start.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="font-bold text-warm-text mb-4 text-sm uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Product
            </h4>
            <ul className="space-y-3 text-warm-text-secondary text-sm">
              <li>
                <a href="#features" className="hover:text-warm-peach transition-colors">
                  Design Studio
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-warm-peach transition-colors">
                  Yardage Calculator
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4
              className="font-bold text-warm-text mb-4 text-sm uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Social
            </h4>
            <ul className="space-y-3 text-warm-text-secondary text-sm">
              <li>
                <Link href="/socialthreads" className="hover:text-warm-peach transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/socialthreads" className="hover:text-warm-peach transition-colors">
                  Discussions
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="font-bold text-warm-text mb-4 text-sm uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Company
            </h4>
            <ul className="space-y-3 text-warm-text-secondary text-sm">
              <li>
                <Link href="/about" className="hover:text-warm-peach transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-warm-peach transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-warm-peach transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-warm-peach transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-warm-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-warm-text-muted">
            &copy; 2026 QuiltCorgi. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-warm-text-muted">
            <Link href="/privacy" className="hover:text-warm-peach transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-warm-peach transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
