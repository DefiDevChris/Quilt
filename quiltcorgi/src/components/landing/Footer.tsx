import Link from 'next/link';
import Mascot from './Mascot';

export default function Footer() {
  return (
    <footer className="bg-warm-surface border-t border-warm-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Mascot pose="standing" size="sm" />
              <span
                className="text-xl font-bold text-warm-text"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                QuiltCorgi
              </span>
            </div>
            <p className="text-warm-text-secondary text-sm">
              Professional quilt design software for modern quilters. Create, share, and print your patterns with ease.
            </p>
            <div className="flex items-center gap-2">
              <Mascot pose="wagging" size="xs" />
              <span className="text-sm text-warm-text-muted">Made with love</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4
              className="font-bold text-warm-text mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Product
            </h4>
            <ul className="space-y-2 text-warm-text-secondary text-sm">
              <li><a href="#features" className="hover:text-warm-peach transition-colors">Designer</a></li>
              <li><a href="#features" className="hover:text-warm-peach transition-colors">Calculator</a></li>
              <li><Link href="/tutorials" className="hover:text-warm-peach transition-colors">Tutorials</Link></li>
              <li><Link href="/blog" className="hover:text-warm-peach transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4
              className="font-bold text-warm-text mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Community
            </h4>
            <ul className="space-y-2 text-warm-text-secondary text-sm">
              <li><Link href="/community" className="hover:text-warm-peach transition-colors">Gallery</Link></li>
              <li><Link href="/tutorials" className="hover:text-warm-peach transition-colors">Tutorials</Link></li>
              <li><Link href="/blog" className="hover:text-warm-peach transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="font-bold text-warm-text mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Company
            </h4>
            <ul className="space-y-2 text-warm-text-secondary text-sm">
              <li><Link href="/about" className="hover:text-warm-peach transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-warm-peach transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-warm-peach transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-warm-peach transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-warm-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-warm-text-muted">
            &copy; 2026 QuiltCorgi. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-warm-text-secondary hover:text-warm-peach transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-warm-text-secondary hover:text-warm-peach transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
