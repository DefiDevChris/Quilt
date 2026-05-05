'use client';

import Image from 'next/image';

export function AuthHeroPanel() {
  return (
    <div className="auth-hero-panel">
      <Image
        src="/p2qd.png"
        alt="Beautiful patchwork quilt"
        fill
        className="object-cover"
        style={{ objectPosition: '35% center' }}
        priority
        sizes="75vw"
      />
      {/* Soft fade on left edge so the image melts under the form panel */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'linear-gradient(to right, var(--color-bg) 0%, var(--color-bg) 25%, transparent 60%)',
        }}
      />
      {/* Subtle warm tint for depth */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          background:
            'linear-gradient(135deg, transparent 50%, rgba(197,223,243,0.15) 100%)',
        }}
      />
    </div>
  );
}
