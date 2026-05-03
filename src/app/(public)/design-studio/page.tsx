import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'QuiltCorgi';

export const metadata: Metadata = {
  title: `${APP_NAME} Design Studio — Design Your Next Quilt in the Browser`,
  description:
    'Design quilts in your browser with a growing block library, drag-and-drop fabrics, and 1:1 PDF export. Completely free — create an account to save and export.',
  openGraph: {
    title: `${APP_NAME} Design Studio`,
    description: 'A modern, browser-based quilt design studio. Free to start.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${APP_NAME} Design Studio` }],
  },
};

export default function DesignStudioLandingPage() {
  return (
    <div className="min-h-screen">

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 lg:pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left Side: Content */}
          <div className="flex-1 text-center lg:text-left">
            <span className="mb-8 inline-flex rounded-full px-4 py-1.5 text-xs font-semibold bg-primary/10 text-primary">
              Cloud-Based Design Tool
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.05] mb-8">
              Design your next quilt <br />
              <span className="text-primary">in the browser.</span>
            </h1>
            <p className="text-xl leading-relaxed mb-12 max-w-xl mx-auto lg:mx-0 text-dim">
              QuiltCorgi Design Studio brings professional design tools to your browser. No
              installation required. Arrange blocks, test fabric stories, and export ready-to-sew
              PDF patterns in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/auth/signup"
                className="btn-primary w-full text-lg sm:w-auto px-10 py-4"
              >
                Start Designing Free
              </Link>
              <Link
                href="/help"
                className="btn-secondary w-full text-lg sm:w-auto px-10 py-4"
              >
                Watch Demo
              </Link>
            </div>

            <p className="mt-8 text-sm flex items-center gap-2 justify-center lg:justify-start text-dim">
              <span className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">★</span>
                ))}
              </span>
              Trusted by 10,000+ modern quilters
            </p>
          </div>

          {/* Right Side: Real Screenshot */}
          <div className="flex-1 relative">
            <div
              className="relative z-10 overflow-hidden rounded-lg border border-default shadow-elevated"
              style={{ aspectRatio: '16/10' }}
            >
              <Image
                src="/images/quilts/studio_quilt_ten_1775440971119.png"
                alt="QuiltCorgi Design Studio Interface"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            {/* Decorative element behind screenshot */}
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 blur-3xl bg-primary" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-10 blur-2xl bg-secondary" />
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ───────────────────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Professional tools for your process.
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-dim">
              We&apos;ve automated the tedious math so you can focus on the creative sparks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="group">
              <div className="relative mb-8 overflow-hidden rounded-lg border border-default shadow-elevated">
                <Image
                  src="/images/quilts/studio_quilt_two_1775440552376.png"
                  alt="Block Library"
                  width={400}
                  height={260}
                  unoptimized
                  className="w-full h-auto object-cover aspect-[3/2]"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg p-2.5 bg-primary/10 text-primary">
                  <Image src="/icons/quilt-02-needle-Photoroom.png" alt="Block Library" width={22} height={22} className="object-contain" unoptimized />
                </div>
                <h3 className="text-xl font-bold text-default">
                  100+ Block Library
                </h3>
              </div>
              <p className="leading-relaxed text-dim">
                Access a massive library of classic and modern blocks. Use the custom builder to
                create unique patterns that are truly your own.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="relative mb-8 overflow-hidden rounded-lg border border-default shadow-elevated">
                <Image
                  src="/images/quilts/studio_quilt_four_1775440582256.png"
                  alt="Fabric Previews"
                  width={400}
                  height={260}
                  unoptimized
                  className="w-full h-auto object-cover aspect-[3/2]"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg p-2.5 bg-primary/10 text-primary">
                  <Image src="/icons/quilt-04-scissors-Photoroom.png" alt="Fabric Sandbox" width={22} height={22} className="object-contain" unoptimized />
                </div>
                <h3 className="text-xl font-bold text-default">
                  Live Fabric Sandbox
                </h3>
              </div>
              <p className="leading-relaxed text-dim">
                Instantly swap fabrics from curated modern collections. See how prints and colors
                interact on your actual quilt before buying a yard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="relative mb-8 overflow-hidden rounded-lg border border-default shadow-elevated">
                <Image
                  src="/images/quilts/studio_quilt_eight_1775440844687.png"
                  alt="Pattern Export"
                  width={400}
                  height={260}
                  unoptimized
                  className="w-full h-auto object-cover aspect-[3/2]"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg p-2.5 bg-primary/10 text-primary">
                  <Image src="/icons/quilt-12-ruler-Photoroom.png" alt="Pattern Export" width={22} height={22} className="object-contain" unoptimized />
                </div>
                <h3 className="text-xl font-bold text-default">
                  Pattern Export
                </h3>
              </div>
              <p className="leading-relaxed text-dim">
                Export precise 1:1 PDF patterns with cutting instructions, seam allowances, and
                accurate yardage calculation for any size project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-default p-16 text-center lg:p-24 bg-gradient-to-br from-surface to-secondary">
          <div className="relative z-10 flex flex-col items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={64}
              height={64}
              unoptimized
              className="mb-8"
            />
            <h2 className="mb-8 text-4xl font-bold lg:text-6xl">
              Start Your Next Masterpiece.
            </h2>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/auth/signup"
                className="btn-primary text-xl px-12 py-5"
              >
                Create Free Account
              </Link>
              <Link
                href="/auth/signin"
                className="btn-secondary text-xl px-12 py-5"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-10 text-sm text-dim">
              Free to design. Create an account to save projects, build print lists, and export patterns.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
