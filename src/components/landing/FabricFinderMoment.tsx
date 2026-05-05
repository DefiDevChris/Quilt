'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

/* ── Inline mockup of the Fabric Library UI ─────────────────────────── */
function FabricLibraryMockup() {
  const FABRICS = [
    {
      name: 'Grove Sky',
      manufacturer: 'Alison Glass',
      price: '$11.49/yd',
      img: '/fabrics/Color Camp - Grove by Alison Glass/10425-T.jpg',
      colorFamily: 'Blue',
    },
    {
      name: 'Grove Leaf',
      manufacturer: 'Alison Glass',
      price: '$12.99/yd',
      img: '/fabrics/Color Camp - Grove by Alison Glass/10428-G.jpg',
      colorFamily: 'Green',
    },
    {
      name: 'Cottage Dot',
      manufacturer: 'Renee Nanneman',
      price: '$9.48/yd',
      img: '/fabrics/Cottage Cloth III by Renee Nanneman/428-Y4.jpg',
      colorFamily: 'Yellow',
    },
    {
      name: 'Grove Seafoam',
      manufacturer: 'Alison Glass',
      price: '$13.25/yd',
      img: '/fabrics/Color Camp - Grove by Alison Glass/10430-LB.jpg',
      colorFamily: 'Blue',
    },
    {
      name: 'Cottage Check',
      manufacturer: 'Renee Nanneman',
      price: '$10.99/yd',
      img: '/fabrics/Cottage Cloth III by Renee Nanneman/428-B4.jpg',
      colorFamily: 'Blue',
    },
    {
      name: 'Cottage Rose',
      manufacturer: 'Renee Nanneman',
      price: '$11.75/yd',
      img: '/fabrics/Cottage Cloth III by Renee Nanneman/428-R5.jpg',
      colorFamily: 'Red',
    },
  ];

  return (
    <div className="rounded-lg overflow-hidden shadow-elevated border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Search + filters bar */}
      <div className="p-4 md:p-5 border-b border-[var(--color-border)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
            />
            <div className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text-dim)]">
              Search fabrics…
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)]">
              All Colors
            </span>
            <span className="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)]">
              All Brands
            </span>
          </div>
        </div>
      </div>

      {/* Fabric grid */}
      <div className="p-4 md:p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FABRICS.map((f) => (
            <div
              key={f.name}
              className="rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-strong)] transition-colors duration-150"
            >
              <div className="aspect-square overflow-hidden relative">
                <Image
                  src={f.img}
                  alt={f.name}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <div className="p-2.5">
                <div className="text-xs font-semibold text-[var(--color-text)] truncate">
                  {f.name}
                </div>
                <div className="text-[10px] text-[var(--color-text-dim)] mt-0.5">
                  {f.manufacturer}
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">
                    {f.colorFamily}
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text)]">
                    {f.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FabricFinderMoment() {
  return (
    <section className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20 bg-[var(--color-secondary)]/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
          {/* UI mockup */}
          <div className="lg:w-7/12 order-1 lg:order-1">
            <ScrollReveal>
              <FabricLibraryMockup />
            </ScrollReveal>
          </div>

          {/* Text */}
          <div className="lg:w-5/12 order-2 lg:order-2">
            <ScrollReveal>
              <h2 className="font-heading text-4xl md:text-5xl font-extrabold leading-tight mb-6">
                A fabric library{' '}
                <span className="text-[var(--color-text-dim)] font-light">that knows what things cost.</span>
              </h2>
              <p className="text-lg text-[var(--color-text-dim)] leading-relaxed mb-4">
                Browse quilting cottons from brands like Moda, Robert Kaufman,
                Riley Blake, and more. Filter by color or manufacturer, see live
                prices from retailers, and drop any swatch straight into your
                quilt design.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Search by color, brand, or name',
                  'Live prices from real retailers',
                  'Drag swatches into your design',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[var(--color-text)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                    <span className="text-base font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/fabrics" className="btn-secondary px-8 py-3">
                Browse the Library
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
