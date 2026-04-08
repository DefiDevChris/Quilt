'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface PostNavigationProps {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export default function PostNavigation({ prev, next }: PostNavigationProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const lineProgress = useTransform(scrollYProgress, [0, 0.5], ['0%', '100%']);

  if (!prev && !next) return null;

  return (
    <nav ref={containerRef} className="relative max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-24">
      <div className="absolute top-0 left-6 md:left-12 right-6 md:right-12 h-px bg-outline-variant">
        <motion.div
          style={{ scaleX: lineProgress, transformOrigin: 'left' }}
          className="h-full bg-primary-golden"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 pt-8">
        <div className="flex flex-col">
          {prev ? (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/blog/${prev.slug}`} className="group block">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-px bg-on-surface transition-all duration-300 group-hover:w-12" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-warm-text-muted font-medium">
                    Previous
                  </span>
                </div>
                <h3
                  className="text-2xl md:text-3xl text-on-surface leading-[1.15] tracking-[-0.01em] group-hover:text-primary-golden transition-colors duration-300"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {prev.title}
                </h3>
              </Link>
            </motion.div>
          ) : (
            <div />
          )}
        </div>

        <div className="flex flex-col md:items-end md:text-right">
          {next && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/blog/${next.slug}`} className="group block">
                <div className="flex items-center gap-3 mb-4 md:flex-row-reverse">
                  <span className="w-8 h-px bg-on-surface transition-all duration-300 group-hover:w-12" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-warm-text-muted font-medium">
                    Next
                  </span>
                </div>
                <h3
                  className="text-2xl md:text-3xl text-on-surface leading-[1.15] tracking-[-0.01em] group-hover:text-primary-golden transition-colors duration-300"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {next.title}
                </h3>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </nav>
  );
}
