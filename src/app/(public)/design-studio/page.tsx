import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Palette, Share2, Printer, Layers } from 'lucide-react';
import { COLORS } from '@/lib/design-system';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'QuiltCorgi';

export const metadata: Metadata = {
  title: `${APP_NAME} Design Studio — Design Your Next Quilt in the Browser`,
  description:
    'Design quilts in your browser with a growing block library, drag-and-drop fabrics, and 1:1 PDF export. Free to start.',
  openGraph: {
    title: `${APP_NAME} Design Studio`,
    description: 'A modern, browser-based quilt design studio. Free to start.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${APP_NAME} Design Studio` }],
  },
};

export default function DesignStudioLandingPage() {
  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, fontFamily: 'var(--font-sans)' }}>
      {/* ─── HEADER ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full border-b backdrop-blur-md"
        style={{
          backgroundColor: `${COLORS.surface}ee`,
          borderColor: `${COLORS.text}1a`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="QuiltCorgi Logo"
              width={40}
              height={40}
              unoptimized
              className="object-contain"
            />
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
            >
              QuiltCorgi
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/shop"
              className="text-sm font-semibold hover:text-[var(--color-primary)] transition-colors"
              style={{ color: COLORS.textDim }}
            >
              Shop Fabrics
            </Link>
            <Link
              href="/help"
              className="text-sm font-semibold hover:text-[var(--color-primary)] transition-colors"
              style={{ color: COLORS.textDim }}
            >
              Guides
            </Link>
            <div className="h-4 w-[1px] bg-slate-200 mx-2" />
            <Link
              href="/auth/signin"
              className="text-sm font-semibold hover:text-[var(--color-primary)] transition-colors"
              style={{ color: COLORS.textDim }}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2 rounded-full text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: COLORS.primary, color: '#fff' }}
            >
              Start Designing
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 lg:pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left Side: Content */}
          <div className="flex-1 text-center lg:text-left">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-8"
              style={{ background: `${COLORS.primary}15`, color: COLORS.primary }}
            >
              Cloud-Based Design Tool
            </span>
            <h1
              className="text-5xl lg:text-7xl font-bold leading-[1.05] mb-8"
              style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
            >
              Design your next quilt <br />
              <span style={{ color: COLORS.primary }}>in the browser.</span>
            </h1>
            <p
              className="text-xl leading-relaxed mb-12 max-w-xl mx-auto lg:mx-0"
              style={{ color: COLORS.textDim }}
            >
              QuiltCorgi Design Studio brings professional design tools to your browser. No
              installation required. Arrange blocks, test fabric stories, and export ready-to-sew
              PDF patterns in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto px-10 py-4 rounded-full text-lg font-bold transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: COLORS.primary,
                  color: '#fff',
                  boxShadow: `0 8px 30px ${COLORS.primary}44`,
                }}
              >
                Start Designing Free
              </Link>
              <Link
                href="/help"
                className="w-full sm:w-auto px-10 py-4 rounded-full text-lg font-bold border-2 transition-all hover:bg-slate-50"
                style={{ borderColor: COLORS.primary, color: COLORS.primary }}
              >
                Watch Demo
              </Link>
            </div>

            <p
              className="mt-8 text-sm flex items-center gap-2 justify-center lg:justify-start"
              style={{ color: COLORS.textDim }}
            >
              <span className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </span>
              Trusted by 10,000+ modern quilters
            </p>
          </div>

          {/* Right Side: Real Screenshot */}
          <div className="flex-1 relative">
            <div
              className="relative z-10 rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-8 border-slate-900"
              style={{ aspectRatio: '16/10' }}
            >
              <Image
                src="/studio-screenshot.png"
                alt="QuiltCorgi Design Studio Interface"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            {/* Decorative element behind screenshot */}
            <div
              className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 blur-3xl"
              style={{ background: COLORS.primary }}
            />
            <div
              className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-10 blur-2xl"
              style={{ background: COLORS.secondary }}
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ───────────────────────────────────── */}
      <section className="py-24" style={{ backgroundColor: COLORS.surface }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <h2
              className="text-4xl lg:text-5xl font-bold mb-6"
              style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
            >
              Professional tools for your process.
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textDim }}>
              We&apos;ve automated the tedious math so you can focus on the creative sparks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="group">
              <div className="relative mb-8 rounded-2xl overflow-hidden shadow-lg transition-transform hover:-translate-y-2">
                <Image
                  src="/studio-blocks.png"
                  alt="Block Library"
                  width={400}
                  height={260}
                  unoptimized
                  className="w-full h-auto object-cover aspect-[3/2]"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
                >
                  <Layers size={22} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>
                  100+ Block Library
                </h3>
              </div>
              <p className="leading-relaxed" style={{ color: COLORS.textDim }}>
                Access a massive library of classic and modern blocks. Use the custom builder to
                create unique patterns that are truly your own.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="relative mb-8 rounded-2xl overflow-hidden shadow-lg transition-transform hover:-translate-y-2">
                <Image
                  src="/studio-hero.png"
                  alt="Fabric Previews"
                  width={400}
                  height={260}
                  unoptimized
                  className="w-full h-auto object-cover aspect-[3/2]"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
                >
                  <Palette size={22} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>
                  Live Fabric Sandbox
                </h3>
              </div>
              <p className="leading-relaxed" style={{ color: COLORS.textDim }}>
                Instantly swap fabrics from curated modern collections. See how prints and colors
                interact on your actual quilt before buying a yard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="relative mb-8 rounded-2xl overflow-hidden shadow-lg transition-transform hover:-translate-y-2">
                <Image
                  src="/studio-pdf.png"
                  alt="Pattern Export"
                  width={400}
                  height={260}
                  unoptimized
                  className="w-full h-auto object-cover aspect-[3/2]"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
                >
                  <Printer size={22} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>
                  Pro Pattern Export
                </h3>
              </div>
              <p className="leading-relaxed" style={{ color: COLORS.textDim }}>
                Export precise 1:1 PDF patterns with cutting instructions, seam allowances, and
                accurate yardage calculation for any size project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div
          className="max-w-5xl mx-auto rounded-[3rem] p-16 lg:p-24 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f1a 100%)' }}
        >
          <div className="relative z-10 flex flex-col items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={64}
              height={64}
              unoptimized
              className="mb-8 invert"
            />
            <h2
              className="text-4xl lg:text-6xl font-bold text-white mb-8"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Start Your Next Masterpiece.
            </h2>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/auth/signup"
                className="px-12 py-5 rounded-full text-xl font-bold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: COLORS.primary,
                  color: '#fff',
                  boxShadow: `0 8px 30px ${COLORS.primary}44`,
                }}
              >
                Create Free Account
              </Link>
              <Link
                href="/auth/signin"
                className="px-12 py-5 rounded-full text-xl font-bold border-2 border-white/20 text-white transition-all hover:bg-white/5"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-10 text-white/50 text-sm">
              Free forever for basic designing. Upgrade only when you need pattern export.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="py-12 border-t" style={{ borderColor: `${COLORS.text}1a` }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm font-medium" style={{ color: COLORS.textDim }}>
            © 2026 QuiltCorgi. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link
              href="/terms"
              className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
              style={{ color: COLORS.textDim }}
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
              style={{ color: COLORS.textDim }}
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
              style={{ color: COLORS.textDim }}
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
