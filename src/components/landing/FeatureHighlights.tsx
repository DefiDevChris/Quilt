'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Mascot from './Mascot';

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
    title: 'Turn Photos Into Quilt Patterns',
    description:
      "Simply upload any favorite photo — a family portrait, a scenic landscape, or a beloved pet — and watch as our intelligent algorithms transform it into a perfectly categorized, block-by-block quilting pattern. It's that easy to create personalized, unforgettable gifts.",
    iconSrc: '/icons/quilt-13-dashed-squares-Photoroom.png',
    iconAlt: 'Quilt layout squares',
    checks: ['Photo-to-Pattern wizard', '7-step guided process', 'OpenCV-powered processing'],
  },
  {
    title: 'Your Full-Service Design Studio',
    description:
      'Prefer starting from a blank canvas? Our comprehensive design studio lets you sketch your ideas, choose from a huge library of blocks, and build your design from scratch. With four connected worktables and six layout modes, the possibilities are endless.',
    iconSrc: '/icons/quilt-09-measuring-tape-Photoroom.png',
    iconAlt: 'Design studio',
    checks: ['105+ quilt blocks', '4 connected worktables', '6 layout modes including free-form'],
  },
  {
    title: 'Visualize Your Quilt Before You Sew',
    description:
      "See a stunning, realistic preview of your finished quilt. Make changes to colors, rearrange blocks, and adjust fabric choices instantly. This visualization ensures you'll fall in love with your design before you make a single cut.",
    iconSrc: '/icons/quilt-04-scissors-Photoroom.png',
    iconAlt: 'Quilting scissors',
    checks: [
      'True-scale PDF with seam allowances',
      'Yardage & cutting calculations',
      'FPP template generation',
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
    <section id="features" className="px-6 lg:px-12 py-16 lg:py-24 bg-background">
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
              className="text-3xl md:text-4xl font-bold text-on-surface"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              What Makes QuiltCorgi Special?
            </h2>
            <p className="text-lg text-secondary mt-2">
              Our user-friendly online studio combines simplicity with powerful design tools
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
              className="glass-panel rounded-2xl p-8 hover:shadow-elevation-4 transition-all"
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
                className="text-xl font-bold text-on-surface mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {feature.title}
              </h3>
              <p className="text-secondary mb-4">{feature.description}</p>
              <ul className="space-y-2 text-sm text-secondary">
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
