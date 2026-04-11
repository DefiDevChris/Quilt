'use client';

import Link from 'next/link';
import Image from 'next/image';
import { QuiltPiece, QuiltPieceRow } from '@/components/decorative/QuiltPiece';

// Real screenshot-like mockup using actual app styling
function SocialThreadsScreenshot() {
  return (
    <div className="relative">
      <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)] border border-[#e8e1da]">
        {/* App content */}
        <div className="bg-[#fdfaf7] min-h-[420px] relative">
          {/* Background subtle accents */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ffc7c7]/30 pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff8d49]/10 pointer-events-none" />

          <div className="relative z-10 p-4 space-y-4 max-w-lg mx-auto">
            {/* Post 1 */}
            <div className="bg-[#ffffff] p-5 border border-[#e8e1da] rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#ffffff] bg-[#ff8d49] flex items-center justify-center shadow-[0_1px_2px_rgba(45,42,38,0.08)] text-[#ffffff] text-sm font-bold">
                  S
                </div>
                <div>
                  <h4 className="font-bold text-[#2d2a26] text-sm">Sarah Mitchell</h4>
                  <p className="text-xs text-[#6b655e]">@sarah_quilts &middot; 2h ago</p>
                </div>
              </div>
              <p className="text-[#2d2a26] mb-3 text-sm leading-relaxed">
                Finally finished my Ohio Star quilt! The per-patch fabric assignment helped me position the
                center motifs perfectly.
              </p>
              <div className="rounded-lg border border-[#e8e1da] mb-3 overflow-hidden">
                <Image
                  src="/images/quilts/gallery_quilt_one_1775440540412.png"
                  alt="Ohio Star Quilt"
                  width={500}
                  height={300}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="flex gap-1 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-[#f43f5e] bg-[#f43f5e]/5 hover:bg-[#f43f5e]/10 transition-colors duration-150">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  24
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-[#6b655e] hover:bg-[#fdfaf7] transition-colors duration-150">
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
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-[#6b655e] hover:bg-[#fdfaf7] transition-colors duration-150">
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
            <div className="bg-[#ffffff] p-5 border border-[#e8e1da] rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#ffffff] bg-[#c084fc] flex items-center justify-center shadow-[0_1px_2px_rgba(45,42,38,0.08)] text-[#ffffff] text-sm font-bold">
                  M
                </div>
                <div>
                  <h4 className="font-bold text-[#2d2a26] text-sm">Modern Quilter</h4>
                  <p className="text-xs text-[#6b655e]">@modern_q &middot; 5h ago</p>
                </div>
              </div>
              <p className="text-[#2d2a26] mb-3 text-sm leading-relaxed">
                Playing with improv piecing on this one. Love how the layout tool lets me visualize
                different arrangements!
              </p>
              <div className="rounded-lg border border-[#e8e1da] mb-3 overflow-hidden">
                <Image
                  src="/images/quilts/gallery_quilt_five_1775440598069.png"
                  alt="Improv Quilt"
                  width={500}
                  height={300}
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="flex gap-1 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-[#6b655e] hover:bg-[#fdfaf7] transition-colors duration-150">
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
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-[#6b655e] hover:bg-[#fdfaf7] transition-colors duration-150">
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
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-[#6b655e] hover:bg-[#fdfaf7] transition-colors duration-150">
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
    <div className="bg-[#ffffff] rounded-lg border border-[#e8e1da] shadow-[0_1px_2px_rgba(45,42,38,0.08)] p-4 flex items-start gap-3 transition-colors duration-150 hover:shadow-[0_1px_2px_rgba(45,42,38,0.12)]">
      <div className="w-10 h-10 rounded-full bg-[#ff8d49]/10 flex items-center justify-center text-[#ff8d49] flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4
          className="font-bold text-[#2d2a26] text-sm mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h4>
        <p className="text-xs text-[#6b655e] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function SocialThreadsSection() {
  return (
    <section
      id="social-threads"
      className="px-6 lg:px-12 py-16 lg:py-24 bg-[#fdfaf7] relative overflow-hidden"
    >
      {/* Decorative quilt-piece backgrounds — massive, very spread, high opacity, charcoal stitches, flush */}
      <QuiltPiece color="secondary" size={900} rotation={0} top={-350} right={-300} opacity={30} strokeWidth={5} stitchGap={16} stitchColor="#2d2a26" />
      <QuiltPiece color="accent" size={800} rotation={0} bottom={-300} left={-200} opacity={32} strokeWidth={5} stitchGap={16} stitchColor="#2d2a26" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Text content */}
          <div>
            <h2
              className="text-[32px] leading-[40px] md:text-[40px] md:leading-[52px] lg:text-[48px] lg:leading-[56px] font-bold text-[#2d2a26] leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Connect With Quilters
              <span className="block text-[#ff8d49]">
                Who Get It
              </span>
            </h2>

            <p className="text-[18px] leading-[28px] text-[#6b655e] mt-4 leading-relaxed">
              Share your latest creations, discover inspiration from fellow quilters, and build
              connections that spark new ideas. Whether you&apos;re looking for feedback on your
              color palette or just want to show off your finished masterpiece &mdash; this is your
              creative home.
            </p>

            {/* Feature grid */}
            <div className="grid sm:grid-cols-2 gap-3 pt-6">
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
                description="See what&apos;s popular and find new techniques to try"
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

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                href="/socialthreads"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#ff8d49] text-[#2d2a26] rounded-full font-bold text-lg hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
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
              <span className="text-sm text-[#6b655e] self-center">
                Join thousands of quilters already sharing
              </span>
            </div>
          </div>

          {/* Right - Screenshot mockup */}
          <div className="relative">
            <SocialThreadsScreenshot />
          </div>
        </div>
      </div>
    </section>
  );
}
