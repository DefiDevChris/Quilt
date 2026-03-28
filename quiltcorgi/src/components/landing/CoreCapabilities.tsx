'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CoreCapabilities() {
  return (
    <section className="py-[8rem] px-4 relative bg-surface overflow-x-clip">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-[2.5rem] md:text-[3rem] font-bold text-on-surface mb-6 leading-[1.1] tracking-[-0.01em]">
              Professional-grade tools.<br/>
              <span className="text-primary italic">Built for precision.</span>
            </h2>
            <p className="text-lg text-secondary mb-8">
              QuiltCorgi equips you with an industry-leading suite of design utilities. From automatic yardage calculations to true-scale PDF pattern exports, every feature is engineered to streamline your quilting workflow.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                'Automatic yardage and sub-cutting calculations',
                'Fussy Cut and Photo Patchwork previewing',
                'True 1:1 scale PDF pattern exports with seam allowances',
                'Infinite canvas with dynamic sash and border layouts'
              ].map((item, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.4 }}
                  className="flex items-start gap-4 text-secondary font-medium"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5 flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="leading-snug">{item}</span>
                </motion.li>
              ))}
            </ul>

            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center bg-primary text-primary-on font-bold px-8 py-4 rounded-full text-lg shadow-[var(--shadow-elevation-1)] hover:shadow-[var(--shadow-elevation-2)] hover:opacity-90 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Explore All Features
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* The floating UI mockup representing Yardage Calculation */}
            <div className="glass-card aspect-square md:aspect-[4/3] rounded-3xl p-6 shadow-2xl border border-white/60 relative overflow-hidden bg-white/40 group">
              
              {/* Animated decorative grid background */}
              <div className="absolute inset-0 opacity-10 transition-transform duration-1000 group-hover:scale-105" 
                   style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--color-primary-dark) 0, var(--color-primary-dark) 1px, transparent 0, transparent 40px)', backgroundSize: '56px 56px' }} />
              
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-transparent z-0" />

              <div className="relative z-10 h-full flex flex-col pt-4">
                <div className="bg-white rounded-2xl shadow-xl w-full h-full border border-surface-container overflow-hidden flex flex-col">
                  {/* Mockup Header */}
                  <div className="h-12 border-b border-surface-container flex items-center px-4 justify-between bg-surface-container-low shrink-0">
                    <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                       Yardage Report
                    </div>
                    <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded font-bold uppercase tracking-wider">Generated</div>
                  </div>

                  {/* Mockup Content */}
                  <div className="p-5 flex-1 overflow-hidden flex flex-col gap-4">
                     <div className="flex gap-4 items-center p-3 bg-surface-container-low rounded-xl border border-surface-container">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white shadow-inner">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-on-surface mb-1">Color A (Primary)</div>
                          <div className="flex items-end justify-between">
                            <div className="text-lg font-bold text-primary">2.5<span className="text-xs text-secondary font-normal ml-1">yards</span></div>
                            <div className="text-[10px] text-secondary">42" width</div>
                          </div>
                        </div>
                     </div>

                     <div className="flex gap-4 items-center p-3 bg-surface-container-low rounded-xl border border-surface-container">
                        <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center text-primary-dark shadow-inner">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-on-surface mb-1">Color B (Accent)</div>
                          <div className="flex items-end justify-between">
                            <div className="text-lg font-bold text-primary">1.25<span className="text-xs text-secondary font-normal ml-1">yards</span></div>
                            <div className="text-[10px] text-secondary">42" width</div>
                          </div>
                        </div>
                     </div>

                     {/* Cutting instructions preview */}
                     <div className="mt-2">
                        <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 border-b border-surface-container pb-1">Sub-cutting Guide</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <div className="h-2 w-3/4 bg-surface-container rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                            <div className="h-2 w-1/2 bg-surface-container rounded" />
                          </div>
                           <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary/30" />
                            <div className="h-2 w-2/3 bg-surface-container rounded" />
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Floating element 1 */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-6 top-12 glass-card p-3 rounded-xl shadow-xl border border-white/80 flex items-center gap-3 z-20"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                <div>
                  <div className="text-[10px] text-secondary">Total Needed</div>
                  <div className="font-bold text-sm text-on-surface">3.75 yds</div>
                </div>
              </motion.div>
              
              {/* Floating element 2 */}
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -left-8 bottom-20 glass-card p-3 rounded-xl shadow-xl border border-white/80 flex items-center gap-2 z-20"
              >
                <div className="text-2xl">✂️</div>
                <div>
                  <div className="font-bold text-xs text-on-surface">Auto-calculated</div>
                  <div className="text-[9px] text-secondary">Includes seam allowance</div>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
