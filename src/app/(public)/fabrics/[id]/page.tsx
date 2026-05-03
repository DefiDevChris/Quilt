'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { FabricListItem } from '@/types/fabric';

interface FabricDetail extends FabricListItem {
  description: string | null;
}

export default function FabricDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [fabric, setFabric] = useState<FabricDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/fabrics/public/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setFabric(json.data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !fabric) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-[var(--color-text-dim)]">Fabric not found.</p>
        <Link
          href="/fabrics"
          className="text-sm text-[var(--color-primary)] hover:underline transition-colors duration-150"
        >
          Back to Fabric Library
        </Link>
      </div>
    );
  }

  const hasAffiliate = fabric.isActive && fabric.deeplinkOverride;
  const price = fabric.pricePerYard ? `$${Number(fabric.pricePerYard).toFixed(2)}/yd` : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-colors duration-150 mb-8"
        >
          <ArrowLeft size={16} />
          Back to Library
        </button>

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
  );
}
