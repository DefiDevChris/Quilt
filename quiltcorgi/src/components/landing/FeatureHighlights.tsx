'use client';

import { motion } from 'framer-motion';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  className: string;
}

function WorktablesIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-sm group-hover:scale-110 transition-transform duration-500 text-primary"
    >
      <rect x="8" y="18" width="24" height="24" rx="4" fill="currentColor" opacity="0.2" />
      <rect x="20" y="12" width="24" height="24" rx="4" fill="currentColor" opacity="0.4" />
      <rect
        x="32"
        y="22"
        width="24"
        height="24"
        rx="4"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line x1="38" y1="30" x2="50" y2="30" stroke="currentColor" strokeWidth="1.5" />
      <line x1="38" y1="35" x2="50" y2="35" stroke="currentColor" strokeWidth="1.5" />
      <line x1="38" y1="40" x2="46" y2="40" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BlocksIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-sm group-hover:scale-110 transition-transform duration-500 text-[#FFBD2E]"
    >
      <rect x="10" y="10" width="12" height="12" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="26" y="10" width="12" height="12" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="42" y="10" width="12" height="12" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="10" y="26" width="12" height="12" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="26" y="26" width="12" height="12" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="42" y="26" width="12" height="12" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="10" y="42" width="12" height="12" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="26" y="42" width="12" height="12" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="42" y="42" width="12" height="12" rx="2" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-sm group-hover:scale-110 transition-transform duration-500 text-primary"
    >
      <rect x="14" y="8" width="36" height="48" rx="4" fill="currentColor" opacity="0.1" />
      <rect
        x="14"
        y="8"
        width="36"
        height="48"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line x1="26" y1="8" x2="26" y2="56" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      <line x1="38" y1="8" x2="38" y2="56" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      <rect x="22" y="24" width="20" height="14" rx="2" fill="currentColor" opacity="0.2" />
      <text x="32" y="34" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="800">
        1:1
      </text>
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-sm group-hover:scale-110 transition-transform duration-500 text-[#4a7c59]"
    >
      <circle cx="22" cy="22" r="8" fill="currentColor" opacity="0.2" />
      <circle cx="42" cy="28" r="6" fill="currentColor" opacity="0.5" />
      <path
        d="M10 42c0-6.6 5.4-12 12-12h0c6.6 0 12 5.4 12 12v6H10v-6z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M34 44c0-4.4 3.6-8 8-8h0c4.4 0 8 3.6 8 8v4H34v-4z"
        fill="currentColor"
        opacity="0.5"
      />
      <path d="M22 22v10M17 27h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-sm group-hover:scale-110 transition-transform duration-500 text-[#9e3b33]"
    >
      <path d="M20 14h24v36H20z" fill="currentColor" opacity="0.1" rx="2" />
      <path d="M14 20h24v36H14z" fill="currentColor" opacity="0.3" rx="2" />
      <circle cx="38" cy="26" r="3" fill="currentColor" />
      <circle cx="26" cy="38" r="3" fill="currentColor" opacity="0.8" />
      <line x1="38" y1="26" x2="26" y2="38" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BlogIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-sm group-hover:scale-110 transition-transform duration-500 text-secondary"
    >
      <rect x="12" y="16" width="40" height="32" rx="4" fill="currentColor" opacity="0.1" />
      <path d="M16 16v32l8-6 8 6V16H16z" fill="currentColor" opacity="0.3" />
      <line
        x1="36"
        y1="26"
        x2="48"
        y2="26"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="36"
        y1="32"
        x2="46"
        y2="32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="36"
        y1="38"
        x2="44"
        y2="38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const features: FeatureCard[] = [
  {
    title: 'Three Connected Worktables',
    description:
      'A deeply considered design environment. Move seamlessly between the Quilt worktable for layout design, the Block worktable for precise drafting, and the Image worktable for calibrating imported fabrics.',
    icon: <WorktablesIcon />,
    className:
      'md:col-span-2 md:row-span-2 flex flex-col justify-between bg-gradient-to-br from-white/70 to-primary/5',
  },
  {
    title: '6,000+ Block Library',
    description:
      'A searchable library of traditional and modern quilt blocks ready to drag directly onto your canvas.',
    icon: <BlocksIcon />,
    className: 'md:col-span-1 md:row-span-1 bg-white/50',
  },
  {
    title: 'Advanced Drafting',
    description:
      'Tools like EasyDraw and Fussy Cut give you complete creative control over every patch.',
    icon: <ToolsIcon />,
    className: 'md:col-span-1 md:row-span-1 bg-white/50',
  },
  {
    title: '1:1 PDF Printing',
    description: 'Export patterns at true scale with perfect seam allowances.',
    icon: <PrintIcon />,
    className: 'md:col-span-1 md:row-span-1 bg-white/50',
  },
  {
    title: 'Community Gallery',
    description: 'Get inspired by a global community of modern quilters.',
    icon: <CommunityIcon />,
    className: 'md:col-span-1 md:row-span-1 bg-white/50',
  },
  {
    title: 'Blog & Tutorials',
    description: 'Learn new skills with our in-depth modern quilting techniques.',
    icon: <BlogIcon />,
    className: 'md:col-span-1 md:row-span-1 bg-white/50',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
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
    <section
      id="features"
      className="relative py-[8rem] bg-surface-container-low px-4 overflow-hidden"
    >
      {/* Background radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary-container),transparent_50%)] opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--color-surface-container-high),transparent_50%)] opacity-50 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold leading-[1.1] tracking-[-0.01em] text-on-surface mb-6">
            A full studio, directly <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark italic pe-2">
              in your browser.
            </span>
          </h2>
          <p className="text-secondary mt-6 max-w-2xl mx-auto text-lg font-medium">
            No massive downloads, no messy installations. QuiltCorgi combines professional
            desktop-grade design capability with modern web accessibility.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]"
        >
          {features.map((feature, i) => (
            <motion.div
              variants={itemVariants}
              key={feature.title}
              className={`group glass-card rounded-3xl p-8 border border-white/60 hover:shadow-[var(--shadow-elevation-3)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${feature.className}`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div
                className={`mb-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-white/80 bg-white/60 backdrop-blur-sm z-10 relative ${i === 0 ? 'w-20 h-20 mb-8' : ''}`}
              >
                {feature.icon}
              </div>

              <div className="relative z-10 mt-6 lg:mt-0">
                <h3
                  className={`${i === 0 ? 'text-[1.75rem]' : 'text-[1.25rem]'} font-extrabold text-on-surface mb-3 tracking-tight group-hover:text-primary transition-colors`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`${i === 0 ? 'text-lg leading-relaxed max-w-md' : 'text-[0.95rem] leading-snug'} text-secondary font-medium`}
                >
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
