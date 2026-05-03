import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import Footer from '@/components/landing/Footer';
import type { FabricListItem } from '@/types/fabric';

interface FabricDetail extends FabricListItem {
  description: string | null;
}

interface FabricDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getFabric(id: string): Promise<FabricDetail | null> {
  const [fabric] = await db
    .select({
      id: fabrics.id,
      name: fabrics.name,
      imageUrl: fabrics.imageUrl,
      thumbnailUrl: fabrics.thumbnailUrl,
      manufacturer: fabrics.manufacturer,
      sku: fabrics.sku,
      collection: fabrics.collection,
      colorFamily: fabrics.colorFamily,
      value: fabrics.value,
      hex: fabrics.hex,
      description: fabrics.description,
      isDefault: fabrics.isDefault,
      retailerId: fabrics.retailerId,
      deeplinkOverride: fabrics.deeplinkOverride,
      isAffiliate: fabrics.isAffiliate,
      isInStockAtRetailer: fabrics.isInStockAtRetailer,
      pricePerYard: fabrics.pricePerYard,
      isActive: fabrics.isActive,
    })
    .from(fabrics)
    .where(and(eq(fabrics.id, id), eq(fabrics.isDefault, true), eq(fabrics.isActive, true)))
    .limit(1);

  if (!fabric) return null;
  return { ...fabric, retailerName: null } as FabricDetail;
}

export async function generateMetadata({ params }: FabricDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const fabric = await getFabric(id);

  if (!fabric) {
    return { title: 'Fabric Not Found' };
  }

  return {
    title: `${fabric.name} — Fabric Library`,
    description: fabric.description ?? `Browse ${fabric.name} by ${fabric.manufacturer ?? 'QuiltCorgi'}`,
  };
}

export default async function FabricDetailPage({ params }: FabricDetailPageProps) {
  const { id } = await params;
  const fabric = await getFabric(id);

  if (!fabric) {
    notFound();
  }

  const hasAffiliate = fabric.isActive && fabric.deeplinkOverride;
  const price = fabric.pricePerYard ? `$${Number(fabric.pricePerYard).toFixed(2)}/yd` : null;

  return (
    <>
      <div className="min-h-screen bg-[var(--color-bg)]">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-12">
          <Link
            href="/fabrics"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-colors duration-150 mb-8"
          >
            <ArrowLeft size={16} />
            Back to Library
          </Link>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square overflow-hidden rounded-lg border border-[var(--color-border)]">
              {fabric.hex ? (
                <div className="w-full h-full" style={{ backgroundColor: fabric.hex }} />
              ) : (
                <img
                  src={fabric.imageUrl}
                  alt={fabric.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <h1
                  className="text-3xl lg:text-4xl font-bold text-[var(--color-text)] mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {fabric.name}
                </h1>
                {fabric.manufacturer && (
                  <p className="text-base text-[var(--color-text-dim)]">
                    {fabric.manufacturer}
                  </p>
                )}
                {fabric.collection && (
                  <p className="text-sm text-[var(--color-text-dim)]">
                    {fabric.collection}
                  </p>
                )}
              </div>

              {price && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[var(--color-text)]">{price}</span>
                  {fabric.retailerName && (
                    <span className="text-xs text-[var(--color-text-dim)]">
                      via {fabric.retailerName}
                    </span>
                  )}
                </div>
              )}

              {fabric.description && (
                <p className="text-sm leading-relaxed text-[var(--color-text-dim)]">
                  {fabric.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {fabric.colorFamily && (
                  <span className="px-3 py-1 rounded-full bg-[var(--color-secondary)] text-xs font-medium text-[var(--color-primary-hover)]">
                    {fabric.colorFamily}
                  </span>
                )}
                {fabric.value && (
                  <span className="px-3 py-1 rounded-full bg-[var(--color-secondary)] text-xs font-medium text-[var(--color-primary-hover)]">
                    {fabric.value} value
                  </span>
                )}
                {fabric.sku && (
                  <span className="px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-dim)]">
                    SKU: {fabric.sku}
                  </span>
                )}
              </div>

              {hasAffiliate ? (
                <div className="mt-auto space-y-2">
                  <a
                    href={`/api/affiliate/click/${fabric.id}`}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-primary)] font-medium hover:bg-[var(--color-primary-hover)] transition-colors duration-150"
                  >
                    <ExternalLink size={16} />
                    Buy at {fabric.retailerName ?? 'Retailer'}
                  </a>
                  <p className="text-[10px] text-[var(--color-text-dim)] leading-tight">
                    Affiliate link — QuiltCorgi may earn a commission at no extra cost to you.
                  </p>
                </div>
              ) : (
                <div className="mt-auto">
                  <p className="text-sm text-[var(--color-text-dim)]">
                    Purchase link not available for this fabric.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
