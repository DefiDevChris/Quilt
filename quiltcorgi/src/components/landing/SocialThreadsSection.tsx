'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// Real screenshot-like mockup using actual app styling
function SocialThreadsScreenshot() {
  return (
    <div className="relative">
      {/* Browser chrome */}
      <div className="bg-white rounded-2xl shadow-2xl border border-warm-border overflow-hidden">
        {/* Window header */}
        <div className="h-12 bg-gradient-to-r from-orange-50 to-rose-50 border-b border-warm-border flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="ml-4 flex items-center gap-2">
              <Image src="/logo.png" alt="QuiltCorgi" width={24} height={24} className="rounded" />
              <span className="text-sm font-bold text-slate-700">Social Threads</span>
            </div>
          </div>
        </div>

        {/* App content - matching actual SocialLayout styling */}
        <div className="bg-[#FDF9F6] min-h-[420px] relative overflow-hidden">
          {/* Background orbs (matching SocialLayout) */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/50 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-200/50 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 p-4 space-y-4 max-w-lg mx-auto">
            {/* Create post card */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-4 border border-white/60 shadow-sm">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0 overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="QuiltCorgi"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 bg-white/60 border border-white/50 rounded-2xl px-4 py-2.5 text-sm text-slate-500">
                  Share your latest quilt design...
                </div>
              </div>
            </div>

            {/* Post 1 - Using actual quilt image */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-5 border border-white/60 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-sm text-white text-sm font-bold">
                  S
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Sarah Mitchell</h4>
                  <p className="text-xs text-slate-500">@sarah_quilts • 2h ago</p>
                </div>
              </div>
              <p className="text-slate-700 mb-3 text-sm leading-relaxed">
                Finally finished my Ohio Star quilt! The fussy cut feature helped me position the
                center motifs perfectly 🌟
              </p>
              <div className="rounded-2xl overflow-hidden border border-white/50 mb-3">
                <Image
                  src="/images/quilts/quilt_10_closeup_star.png"
                  alt="Ohio Star Quilt"
                  width={500}
                  height={300}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="flex gap-1 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-rose-500 bg-rose-50/50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  24
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-white/50">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  8
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-white/50">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
              </div>
            </div>

            {/* Post 2 */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-5 border border-white/60 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-sm text-white text-sm font-bold">
                  M
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Modern Quilter</h4>
                  <p className="text-xs text-slate-500">@modern_q • 5h ago</p>
                </div>
              </div>
              <p className="text-slate-700 mb-3 text-sm leading-relaxed">
                Playing with improv piecing on this one. Love how the layout tool lets me visualize
                different arrangements!
              </p>
              <div className="rounded-2xl overflow-hidden border border-white/50 mb-3">
                <Image
                  src="/images/quilts/quilt_25_floor_improv.png"
                  alt="Improv Quilt"
                  width={500}
                  height={300}
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="flex gap-1 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-white/50">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  42
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-white/50">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  15
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-white/50">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-start gap-3 hover:shadow-lg transition-all">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center text-warm-peach flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4
          className="font-bold text-warm-text text-sm mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h4>
        <p className="text-xs text-warm-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function SocialThreadsSection() {
  return (
    <section
      id="social-threads"
      className="px-6 lg:px-12 py-16 lg:py-24 bg-warm-bg relative overflow-hidden"
    >
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-200/20 to-rose-200/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -translate-x-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-warm-peach/10 to-warm-golden/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 translate-x-1/3" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-warm-text leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Connect With Quilters
              <span className="block bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                Who Get It
              </span>
            </h2>

            <p className="text-lg text-warm-text-secondary leading-relaxed">
              Share your latest creations, discover inspiration from fellow quilters, and build
              connections that spark new ideas. Whether you&apos;re looking for feedback on your
              color palette or just want to show off your finished masterpiece — this is your
              creative home.
            </p>

            {/* Feature grid */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <FeatureCard
                icon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                }
                title="Share Your Work"
                description="Post your quilt designs and get feedback from the community"
              />
              <FeatureCard
                icon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                }
                title="Save Favorites"
                description="Bookmark designs you love to revisit for future inspiration"
              />
              <FeatureCard
                icon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
                title="Discover Trends"
                description="See what's popular and find new techniques to try"
              />
              <FeatureCard
                icon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                title="Meet Makers"
                description="Connect with quilters who share your passion and style"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/socialthreads"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Explore Social Threads
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <span className="text-sm text-warm-text-muted self-center">
                Join thousands of quilters already sharing
              </span>
            </div>
          </motion.div>

          {/* Right - Screenshot mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <SocialThreadsScreenshot />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
