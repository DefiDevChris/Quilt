'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative pt-[6rem] lg:pt-[8rem] pb-[10rem] bg-surface px-4 overflow-hidden shadow-inner">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-outline-variant)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-outline-variant)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.07]" />

      {/* Decorative blurred background orbs */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-60 mix-blend-multiply" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-primary-container/60 rounded-full blur-[100px] opacity-60 mix-blend-multiply" 
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Left column Content */}
        <div className="text-center lg:text-left relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/20 text-sm font-semibold text-primary-on-container mb-6 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>The Modern Quilt Design Studio</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="font-sans font-extrabold text-[3.5rem] sm:text-[4rem] lg:text-[4.5rem] tracking-tight leading-[1.05] text-on-surface"
          >
            Design quilts,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff9b4f]">
              share the craft.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-6 text-lg sm:text-xl text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
          >
            Professional block drafting, fabric visualization, 1:1 print tracking, and an inspiring global community — all beautifully tailored into your browser without downloading a thing.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            <Link
              href="/auth/signup"
              className="group relative inline-flex items-center justify-center bg-primary text-primary-on font-bold px-8 py-4 rounded-full text-lg shadow-[var(--shadow-elevation-2)] hover:shadow-[var(--shadow-elevation-3)] overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative">Start Designing Free</span>
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-on-surface font-semibold glass-card px-8 py-4 rounded-full hover:bg-white/60 transition-colors shadow-sm"
            >
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Watch Demo
            </button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 flex items-center justify-center lg:justify-start gap-4 text-sm text-secondary font-semibold"
          >
            <div className="flex -space-x-3">
              {[
                { init: 'A', bg: 'bg-[#f4ebe1]' },
                { init: 'R', bg: 'bg-[#e8d5c4]' },
                { init: 'J', bg: 'bg-[#ecd2b8]' },
                { init: 'M', bg: 'bg-[#d8c2b3]' }
              ].map((user, i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-surface ${user.bg} flex items-center justify-center text-sm font-bold text-primary-dark shadow-sm z-10 hover:-translate-y-1 transition-transform`} style={{ zIndex: 10 - i }}>
                  {user.init}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex gap-1 text-[#FFBD2E]">
                {[1,2,3,4,5].map(star => (
                   <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ))}
              </div>
              <span>Join 12,000+ happy quilters</span>
            </div>
          </motion.div>
        </div>

        {/* Right column — Highly Detailed UI Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: 20, rotateY: 10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 50 }}
          className="relative w-full aspect-[4/3] rounded-2xl glass-card flex flex-col overflow-hidden shadow-[var(--shadow-elevation-4)] border border-white/60 group perspective-1000"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Mockup Window Chrome */}
          <div className="h-12 bg-white/70 backdrop-blur-xl border-b border-surface-container flex items-center px-4 gap-4 z-20 relative shadow-sm">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="h-7 px-8 bg-surface-container rounded-md flex items-center gap-2 text-[11px] font-bold text-secondary shadow-inner">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Drafting: Ohio_Star_Block.qc
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex flex-1 relative bg-surface-container-lowest overflow-hidden">
             
             {/* Left Tool Rail */}
             <div className="w-14 bg-white/60 border-r border-surface-container flex flex-col items-center py-4 gap-4 z-10 backdrop-blur-md">
                {[
                  <svg key="1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>,
                  <svg key="2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
                  <svg key="3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
                  <svg key="4" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
                ].map((icon, i) => (
                  <div key={i} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${i === 1 ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-secondary hover:bg-surface-container hover:text-on-surface'}`}>
                    {icon}
                  </div>
                ))}
             </div>

             {/* Main Canvas Viewport */}
             <div className="flex-1 relative flex items-center justify-center p-8">
               {/* Dot Grid Background */}
               <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--color-outline-variant) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3 }} />

               {/* Design Block Element */}
               <motion.div 
                 className="relative w-64 h-64 bg-white shadow-md border border-outline-variant/30 flex items-center justify-center p-2 z-10"
               >
                 <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                    {/* Background Patch */}
                    <rect width="100" height="100" fill="#fdfbf7" />
                    
                    {/* Ohio Star Geometries */}
                    {/* Center Square */}
                    <rect x="33.3" y="33.3" width="33.3" height="33.3" fill="var(--color-primary-container)" />
                    {/* Top Triangle */}
                    <polygon points="33.3,33.3 50,0 66.6,33.3" fill="var(--color-primary)" />
                    <polygon points="33.3,33.3 66.6,33.3 50,50" fill="var(--color-primary-dark)" opacity="0.6"/>
                    {/* Bottom Triangle */}
                    <polygon points="33.3,66.6 66.6,66.6 50,100" fill="var(--color-primary)" />
                    <polygon points="33.3,66.6 50,50 66.6,66.6" fill="var(--color-primary-dark)" opacity="0.6" />
                    {/* Left Triangle */}
                    <polygon points="33.3,33.3 0,50 33.3,66.6" fill="var(--color-primary)" opacity="0.8" />
                    <polygon points="33.3,33.3 33.3,66.6 50,50" fill="var(--color-primary-dark)" opacity="0.8" />
                    {/* Right Triangle */}
                    <polygon points="66.6,33.3 100,50 66.6,66.6" fill="var(--color-primary)" opacity="0.8" />
                    <polygon points="66.6,33.3 50,50 66.6,66.6" fill="var(--color-primary-dark)" opacity="0.8" />
                 </svg>

                 {/* Simulated Selection Box overlay */}
                 <motion.div 
                   animate={{ opacity: [0.4, 1, 0.4] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute top-[32%] right-[32%] w-[35%] h-[35%] border-[1.5px] border-primary border-dashed z-20"
                 >
                   <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-primary shadow-sm" />
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-primary shadow-sm" />
                   <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-primary shadow-sm" />
                   <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-primary shadow-sm" />
                 </motion.div>
               </motion.div>
               
               {/* Floating UI Properties Panel (Right overlay inside canvas) */}
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.6, delay: 0.8 }}
                 className="absolute top-6 right-6 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-[var(--shadow-elevation-2)] border border-surface-container p-4 z-20"
               >
                 <h4 className="text-[10px] uppercase font-bold text-secondary mb-3 tracking-wider">Patch Properties</h4>
                 <div className="space-y-3">
                   <div>
                     <div className="text-[10px] text-secondary mb-1">Shape</div>
                     <div className="h-7 bg-surface-container rounded flex items-center px-2 text-xs font-semibold text-on-surface">Half Square Triangle</div>
                   </div>
                   <div>
                     <div className="text-[10px] text-secondary mb-1">Color Fill</div>
                     <div className="flex gap-2">
                       <div className="w-6 h-6 rounded-full bg-primary shadow-inner border border-black/10 ring-2 ring-primary/30 ring-offset-1" />
                       <div className="w-6 h-6 rounded-full bg-primary-dark shadow-inner border border-black/10" />
                       <div className="w-6 h-6 rounded-full bg-primary-container shadow-inner border border-black/10" />
                     </div>
                   </div>
                   <div>
                     <div className="text-[10px] text-secondary mb-1">Dimensions</div>
                     <div className="flex gap-2">
                       <div className="flex-1 h-6 bg-surface-container rounded flex items-center justify-center text-[10px] text-secondary font-mono">W: 4.5"</div>
                       <div className="flex-1 h-6 bg-surface-container rounded flex items-center justify-center text-[10px] text-secondary font-mono">H: 4.5"</div>
                     </div>
                   </div>
                 </div>
               </motion.div>

               {/* Corgi Mascot Peekaboo */}
               <motion.div 
                 initial={{ y: 100, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ type: "spring", stiffness: 60, delay: 1 }}
                 className="absolute -bottom-8 -left-8 w-48 h-48 z-30 pointer-events-none drop-shadow-2xl"
               >
                 <Image src="/corgi2.png" alt="QuiltCorgi Mascot" fill className="object-contain" priority />
                 
                 {/* Tooltip bubble */}
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 1.5, type: "spring" }}
                   className="absolute top-4 -right-12 glass-card bg-white px-3 py-2 rounded-2xl rounded-bl-sm shadow-[var(--shadow-elevation-3)] text-xs font-bold text-primary-on-container whitespace-nowrap border border-white"
                 >
                   Looks paw-fect! ✨
                 </motion.div>
               </motion.div>

             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
