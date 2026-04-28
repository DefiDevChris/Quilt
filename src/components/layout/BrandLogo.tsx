'use client';

import Link from 'next/link';
import Mascot from '@/components/landing/Mascot';

interface BrandLogoProps {
  href?: string;
  className?: string;
}

/**
 * Standardized QuiltCorgi logo and wordmark.
 * Used in AppShell, PublicNav, ShopHeader, and other branded layouts.
 */
export function BrandLogo({ href = '/', className = '' }: BrandLogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-3 cursor-pointer group ${className}`}>
      <Mascot size="xs" pose="sitting" />
      <span className="font-sans text-2xl font-black tracking-tight text-[var(--color-text)] leading-none">
        QuiltCorgi
      </span>
    </Link>
  );
}
