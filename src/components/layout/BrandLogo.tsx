'use client';

import Image from 'next/image';
import Link from 'next/link';

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
      <Image 
        src="/logo.png" 
        alt="QuiltCorgi" 
        width={32} 
        height={32} 
        className="object-contain"
      />
      <span className="font-sans text-2xl font-black tracking-tight text-[var(--color-text)] leading-none">
        QuiltCorgi
      </span>
    </Link>
  );
}
