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
    <div className="min-h-screen overflow-x-hidden">

      {/* HERO — scattered collage, no container */}
      <section className="relative pt-20 pb-32 lg:pt-28 lg:pb-48 px-6 lg:px-16">
        {/* floating quilt patches */}
        <div className="absolute top-8 right-[5%] hidden lg:block animate-float-1 opacity-90">
          <QuiltImg src="/images/quilts/studio_quilt_two_1775440552376.png" alt="Block arrangement" width={220} height={150} className="rounded-lg border border-[var(--color-border)]" />
        </div>
        <div className="absolute top-32 right-[28%] hidden lg:block animate-float-2 opacity-80">
          <QuiltImg src="/images/quilts/studio_quilt_four_1775440582256.png" alt="Fabric preview" width={180} height={120} className="rounded-lg border border-[var(--color-border)]" />
        </div>
        <div className="absolute bottom-16 right-[12%] hidden lg:block animate-float-3 opacity-85">
          <QuiltImg src="/images/quilts/gallery_quilt_one_1775440540412.png" alt="Quilt preview" width={200} height={140} className="rounded-lg border border-[var(--color-border)]" />
        </div>
        <div className="absolute top-40 left-[4%] hidden xl:block animate-float-1 opacity-70">
          <QuiltImg src="/images/quilts/simple_quilt_one_1775442292809.png" alt="Simple quilt" width={160} height={110} className="rounded-lg border border-[var(--color-border)]" />
        </div>

        <div className="absolute top-6 right-[42%] hidden lg:block">
          <Corgi pose="corgi13" size={96} className="rotate-[15deg]" />
        </div>

        <div className="relative max-w-[72rem] mx-auto">
          <h1 className="text-[clamp(3rem,8vw,7rem)] font-black leading-[0.92] tracking-tight mb-10" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            <span className="block">Design</span>
            <span className="block">your next</span>
            <span className="block" style={{ color: 'var(--color-primary)' }}>quilt.</span>
          </h1>

          <p className="text-lg lg:text-xl leading-relaxed max-w-md mb-12" style={{ color: 'var(--color-text-dim)' }}>
            No installation. No spreadsheets. Just blocks, fabrics, and a corgi who really wants to help you finish that pattern.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/auth/signup" className="btn-primary text-base px-8 py-3">Start Designing Free</Link>
            <Link href="/help" className="text-sm font-bold uppercase tracking-[0.2em] border-b-2 border-[var(--color-primary)] pb-1 hover:text-[var(--color-primary)] transition-colors duration-150" style={{ color: 'var(--color-text)' }}>
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* BLOCK LIBRARY — asymmetric bleed */}
      <section className="relative py-24 lg:py-36 px-6 lg:px-16">
        <div className="max-w-[80rem] mx-auto">
          <div className="lg:flex lg:items-start lg:gap-20">
            <div className="lg:w-[45%] relative z-10">
              <span className="text-[clamp(4rem,12vw,9rem)] font-black leading-none block mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>100+</span>
              <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                blocks
                <br />ready to
                <br />piece.
              </h2>
              <p className="text-base leading-relaxed max-w-sm mb-8" style={{ color: 'var(--color-text-dim)' }}>
                Classic nine-patch to modern improvisational layouts. Drag them onto the canvas, swap sizes, rotate, and make them yours. The library grows every month.
              </p>
              <Link href="/auth/signup" className="text-sm font-bold uppercase tracking-[0.2em] border-b-2 border-[var(--color-primary)] pb-1 hover:text-[var(--color-primary)] transition-colors duration-150" style={{ color: 'var(--color-text)' }}>
                Open the library →
              </Link>
            </div>

            <div className="lg:w-[55%] relative mt-16 lg:mt-0">
              <div className="lg:absolute lg:-top-12 lg:-left-24">
                <QuiltImg src="/images/quilts/studio_quilt_eight_1775440844687.png" alt="Block arrangement" width={520} height={340} className="rounded-lg border border-[var(--color-border)] rotate-[3deg]" />
              </div>
              <div className="hidden lg:block absolute top-48 -right-8">
                <QuiltImg src="/images/quilts/studio_quilt_ten_1775440971119.png" alt="Colorful quilt preview" width={280} height={190} className="rounded-lg border border-[var(--color-border)] rotate-[-5deg]" />
              </div>
              <div className="hidden lg:block absolute -bottom-8 left-16">
                <Image src="/icons/quilt-02-needle-Photoroom.png" alt="" width={80} height={80} unoptimized className="rotate-[25deg] opacity-60" />
              </div>
              <div className="hidden lg:block absolute -bottom-20 -right-4">
                <Corgi pose="corgi29" size={140} className="rotate-[-8deg]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FABRIC SANDBOX — offset diagonal */}
      <section className="relative py-24 lg:py-40 px-6 lg:px-16">
        <div className="max-w-[80rem] mx-auto">
          <div className="lg:flex lg:flex-row-reverse lg:items-center lg:gap-16">
            <div className="lg:w-[48%] lg:pt-24">
              <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-8" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                Try fabrics
                <br /><span style={{ color: 'var(--color-primary)' }}>without</span>
                <br />buying a yard.
              </h2>
              <p className="text-base leading-relaxed max-w-md mb-8" style={{ color: 'var(--color-text-dim)' }}>
                Drag curated modern collections onto your blocks in real time. See how prints and colors interact before you commit to a single fat quarter. When you are ready, we find the best deals.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link href="/fabrics" className="btn-secondary text-sm px-6 py-2.5">Browse Fabrics</Link>
                <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-dim)' }}>Deals updated daily</span>
              </div>
            </div>

            <div className="lg:w-[52%] relative mt-16 lg:mt-0 min-h-[24rem]">
              <div className="absolute top-0 left-[10%] rotate-[-4deg]">
                <QuiltImg src="/images/quilts/gallery_quilt_five_1775440598069.png" alt="Fabric story preview" width={360} height={250} className="rounded-lg border border-[var(--color-border)]" />
              </div>
              <div className="absolute top-24 right-[5%] rotate-[7deg] hidden md:block">
                <QuiltImg src="/images/quilts/simple_quilt_three_1775442334013.png" alt="Palette test" width={260} height={180} className="rounded-lg border border-[var(--color-border)]" />
              </div>
              <div className="absolute bottom-0 left-[20%] rotate-[2deg]">
                <QuiltImg src="/images/quilts/gallery_quilt_seven_1775440703829.png" alt="Color combination" width={300} height={200} className="rounded-lg border border-[var(--color-border)]" />
              </div>
              <div className="absolute top-8 right-[40%] hidden lg:block">
                <Image src="/icons/quilt-04-scissors-Photoroom.png" alt="" width={64} height={64} unoptimized className="rotate-[-30deg] opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHOTO TO QUILT */}
      <section className="relative py-24 lg:py-36 px-6 lg:px-16 overflow-hidden">
        <div className="max-w-[80rem] mx-auto relative">
          <div className="lg:absolute lg:top-1/2 lg:left-[30%] lg:-translate-y-1/2 lg:w-[60%]">
            <QuiltImg src="/images/quilts/gallery_quilt_nine_1775440876043.png" alt="Photo transformed into quilt" width={900} height={520} className="rounded-lg border border-[var(--color-border)] rotate-[-2deg] opacity-40 lg:opacity-100" />
          </div>
          <div className="relative z-10 lg:w-[45%]">
            <div className="mb-6"><Corgi pose="corgi18" size={80} className="rotate-[10deg]" /></div>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              Turn any
              <br />photo into
              <br /><span style={{ color: 'var(--color-primary)' }}>patchwork.</span>
            </h2>
            <p className="text-base leading-relaxed max-w-sm mb-8" style={{ color: 'var(--color-text-dim)' }}>
              Upload a picture. We remove the background, suggest a palette, and build a block-ready pattern. Your dog, your garden, your vacation sunset — now a quilt.
            </p>
            <Link href="/photo-to-quilt" className="text-sm font-bold uppercase tracking-[0.2em] border-b-2 border-[var(--color-primary)] pb-1 hover:text-[var(--color-primary)] transition-colors duration-150" style={{ color: 'var(--color-text)' }}>
              Try Photo to Quilt →
            </Link>
          </div>
        </div>
      </section>

      {/* PICTURE MY BLOCKS */}
      <section className="relative py-24 lg:py-36 px-6 lg:px-16">
        <div className="max-w-[80rem] mx-auto">
          <div className="lg:flex lg:items-start lg:gap-12">
            <div className="lg:w-[55%] relative min-h-[22rem] lg:min-h-[28rem]">
              <div className="absolute top-0 left-0 rotate-[5deg]">
                <QuiltImg src="/images/quilts/simple_quilt_four_1775442346667.png" alt="User uploaded blocks" width={380} height={260} className="rounded-lg border border-[var(--color-border)]" />
              </div>
              <div className="absolute top-20 left-[35%] rotate-[-6deg] hidden md:block">
                <QuiltImg src="/images/quilts/gallery_quilt_three_1775440641353.png" alt="Arranged blocks" width={300} height={210} className="rounded-lg border border-[var(--color-border)]" />
              </div>
              <div className="absolute bottom-0 left-[15%] rotate-[3deg]">
                <QuiltImg src="/images/quilts/studio_quilt_two_1775440552376.png" alt="Custom block grid" width={320} height={220} className="rounded-lg border border-[var(--color-border)]" />
              </div>
              <div className="absolute bottom-8 right-[10%] hidden lg:block">
                <Image src="/icons/quilt-13-dashed-squares-Photoroom.png" alt="" width={72} height={72} unoptimized className="rotate-[20deg] opacity-50" />
              </div>
            </div>
            <div className="lg:w-[40%] mt-16 lg:mt-32 relative z-10">
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                Your blocks.
                <br />Your grid.
                <br /><span style={{ color: 'var(--color-primary)' }}>Your rules.</span>
              </h2>
              <p className="text-base leading-relaxed max-w-sm mb-8" style={{ color: 'var(--color-text-dim)' }}>
                Upload photos of blocks you have already sewn. Arrange them on a customizable grid, preview with real fabrics, and plan the final layout before you sew another seam.
              </p>
              <Link href="/picture-my-blocks" className="text-sm font-bold uppercase tracking-[0.2em] border-b-2 border-[var(--color-primary)] pb-1 hover:text-[var(--color-primary)] transition-colors duration-150" style={{ color: 'var(--color-text)' }}>
                Start Picture My Blocks →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FABRIC DEALS */}
      <section className="relative py-24 lg:py-32 px-6 lg:px-16">
        <div className="max-w-[60rem] mx-auto text-center lg:text-left lg:flex lg:items-center lg:gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              Find the
              <br /><span style={{ color: 'var(--color-primary)' }}>best deals</span>
              <br />on fabric.
            </h2>
            <p className="text-base leading-relaxed max-w-md mb-8" style={{ color: 'var(--color-text-dim)' }}>
              We track prices across major retailers so you do not have to. Filter by color family, brand, or collection. Save to your print list and buy when the price drops.
            </p>
            <Link href="/fabrics" className="btn-primary text-sm px-6 py-2.5">Hunt Deals</Link>
          </div>
          <div className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center lg:justify-end">
            <div className="relative">
              <Image src="/icons/quilt-01-spool-Photoroom.png" alt="Fabric spool" width={200} height={200} unoptimized className="rotate-[-15deg] opacity-80" />
              <div className="absolute -bottom-6 -left-8"><Corgi pose="corgi25" size={100} className="rotate-[12deg]" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* PDF EXPORT */}
      <section className="relative py-24 lg:py-40 px-6 lg:px-16 overflow-hidden">
        <div className="max-w-[80rem] mx-auto">
          <div className="lg:flex lg:items-end lg:gap-20">
            <div className="lg:w-[55%]">
              <span className="text-[clamp(3rem,10vw,8rem)] font-black leading-none block mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-secondary)' }}>1:1</span>
              <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                PDF patterns
                <br />ready for the
                <br />sewing room.
              </h2>
              <p className="text-base leading-relaxed max-w-md mb-8" style={{ color: 'var(--color-text-dim)' }}>
                Export exact-scale patterns with cutting instructions, seam allowances, and yardage math already done. Print and start sewing today.
              </p>
              <Link href="/auth/signup" className="btn-primary text-sm px-6 py-2.5">Start Designing Free</Link>
            </div>
            <div className="lg:w-[45%] mt-16 lg:mt-0 relative min-h-[20rem]">
              <div className="absolute top-0 right-[10%] rotate-[4deg]">
                <QuiltImg src="/images/quilts/studio_quilt_four_1775440582256.png" alt="Pattern preview" width={340} height={230} className="rounded-lg border border-[var(--color-border)]" />
              </div>
              <div className="absolute top-24 left-[5%] rotate-[-5deg] hidden md:block">
                <QuiltImg src="/images/quilts/gallery_quilt_seven_1775440703829.png" alt="Cutting layout" width={260} height={180} className="rounded-lg border border-[var(--color-border)]" />
              </div>
              <div className="absolute -bottom-4 right-[30%] hidden lg:block">
                <Image src="/icons/quilt-12-ruler-Photoroom.png" alt="" width={80} height={80} unoptimized className="rotate-[18deg] opacity-60" />
              </div>
              <div className="absolute -top-8 -right-4 hidden lg:block">
                <Corgi pose="corgi28" size={120} className="rotate-[6deg]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — no box */}
      <section className="relative py-32 lg:py-48 px-6 lg:px-16">
        <div className="max-w-[60rem] mx-auto text-center">
          <Image src="/logo.png" alt="QuiltCorgi" width={80} height={80} unoptimized className="mx-auto mb-8 opacity-90" />
          <h2 className="text-4xl lg:text-7xl font-black tracking-tight mb-10" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            Ready to start?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup" className="btn-primary text-lg px-10 py-4">Create Free Account</Link>
            <Link href="/auth/signin" className="btn-secondary text-lg px-10 py-4">Sign In</Link>
          </div>
          <p className="mt-10 text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Free to design. Save projects, build print lists, and export patterns.
          </p>
          <div className="mt-12 flex justify-center">
            <Corgi pose="corgi15" size={160} className="rotate-[-4deg] opacity-80" />
          </div>
        </div>
      </section>

    </div>
  );
}

function QuiltImg({ src, alt, width, height, className = '' }: { src: string; alt: string; width: number; height: number; className?: string }) {
  return <Image src={src} alt={alt} width={width} height={height} unoptimized className={`object-cover ${className}`} />;
}

function Corgi({ pose, size = 128, className = '' }: { pose: string; size?: number; className?: string }) {
  return (
    <Image
      src={`/mascots&avatars/${pose}.png`}
      alt="QuiltCorgi"
      width={size}
      height={size}
      unoptimized
      className={`object-contain bg-transparent ${className}`}
    />
  );
}
