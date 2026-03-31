'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Mascot from './Mascot';

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <svg
        className="w-4 h-4 text-warm-peach flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </li>
  );
}

const features = [
  {
    title: 'Your Design Studio',
    description:
      'Four worktables, one creative flow. Lay out your quilt, draft custom blocks with snap-to-grid precision, and choose from four layout modes including sashing and on-point.',
    iconSrc: '/icons/quilt-13-dashed-squares-Photoroom.png',
    iconAlt: 'Quilt layout squares',
    checks: ['4 connected worktables', '659+ block library', '6 layout modes'],
  },
  {
    title: 'Yardage & Cutting Made Easy',
    description:
      'No more guesswork at the fabric counter. QuiltCorgi calculates your yardage, generates sub-cutting charts, and even calibrates imported fabric photos to real-world scale.',
    iconSrc: '/icons/quilt-09-measuring-tape-Photoroom.png',
    iconAlt: 'Measuring tape',
    checks: [
      'Automatic yardage estimation',
      'Sub-cutting & rotary charts',
      'Real-world fabric calibration',
    ],
  },
  {
    title: 'Print-Ready Patterns',
    description:
      'Export true 1:1 scale PDFs with seam allowances baked right in. Generate Foundation Paper Piecing templates and rotary cutting charts that go straight from your printer to your sewing room.',
    iconSrc: '/icons/quilt-04-scissors-Photoroom.png',
    iconAlt: 'Quilting scissors',
    checks: [
      'True-scale PDF with seam allowances',
      'FPP template generation',
      'Rotary cutting charts',
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 50, damping: 15 },
  },
};

export default function FeatureHighlights() {
  return (
    <section id="features" className="px-6 lg:px-12 py-16 lg:py-24 bg-warm-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-16"
        >
          <Mascot pose="scratching" size="lg" />
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold text-warm-text"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Everything But the Fabric
            </h2>
            <p className="text-lg text-warm-text-secondary mt-2">
              Design, calculate, and print — all in one place
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="glass-panel rounded-2xl p-8 hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 mb-6">
                <Image
                  src={feature.iconSrc}
                  alt={feature.iconAlt}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3
                className="text-xl font-bold text-warm-text mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {feature.title}
              </h3>
              <p className="text-warm-text-secondary mb-4">{feature.description}</p>
              <ul className="space-y-2 text-sm text-warm-text-secondary">
                {feature.checks.map((check) => (
                  <CheckItem key={check}>{check}</CheckItem>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
