'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

function QuiltWorktableMockup() {
  return (
    <div className="w-full h-full bg-surface-container-low flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-10 bg-white border-b border-surface-container flex items-center px-4 justify-between z-10 shrink-0">
        <div className="flex gap-4 items-center">
          <div className="text-[10px] font-bold text-secondary bg-surface-container px-2 py-1 rounded">My_First_Quilt.qc</div>
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded hover:bg-surface-container flex items-center justify-center text-secondary cursor-pointer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg></div>
            <div className="w-5 h-5 rounded hover:bg-surface-container flex items-center justify-center text-primary cursor-pointer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
          </div>
        </div>
        <div className="text-[10px] text-secondary font-mono">Zoom: 45%</div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Toolbar */}
        <div className="w-12 bg-white border-r border-surface-container py-2 flex flex-col items-center gap-3 shrink-0 z-10">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 3 21 12 3 21 3 3"/></svg></div>
          <div className="w-8 h-8 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg></div>
          <div className="w-8 h-8 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#fdfbf7] relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--color-outline-variant) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.2 }} />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white shadow-xl border border-surface-container p-2 flex"
          >
            {/* 3x3 Quilt Layout with Sashing */}
            <div className="grid grid-cols-3 gap-2 bg-primary-container/30 p-2 border-[4px] border-primary-dark/80">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-16 h-16 bg-white flex items-center justify-center border border-outline-variant/30 relative overflow-hidden group">
                  <div className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity">
                    {/* A placeholder block pattern */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <polygon points="0,0 50,50 0,100" fill="var(--color-primary-container)" />
                      <polygon points="0,0 100,0 50,50" fill="var(--color-primary)" />
                      <polygon points="100,0 100,100 50,50" fill="var(--color-primary-dark)" opacity="0.8" />
                      <polygon points="0,100 100,100 50,50" fill="white" />
                    </svg>
                  </div>
                  {i === 4 && (
                    <div className="absolute inset-0 border-2 border-primary z-10" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel */}
        <div className="w-48 bg-white border-l border-surface-container p-3 shrink-0 z-10 flex flex-col gap-4 text-xs">
          <div>
            <div className="font-bold text-on-surface mb-2">Layout Settings</div>
            <div className="h-6 bg-surface-container rounded mb-2 flex items-center px-2 text-secondary">Horizontal</div>
            <div className="grid grid-cols-2 gap-2">
               <div className="h-6 bg-surface-container rounded flex items-center justify-center text-secondary">3 cols</div>
               <div className="h-6 bg-surface-container rounded flex items-center justify-center text-secondary">3 rows</div>
            </div>
          </div>
          <div>
            <div className="font-bold text-on-surface mb-2">Sashing</div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded border border-primary bg-primary flex items-center justify-center text-white"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
              <span className="text-secondary">Include Sashing</span>
            </div>
            <div className="h-6 bg-surface-container rounded flex items-center px-2 text-secondary justify-between">
              <span>Width</span>
              <span className="font-mono text-[10px]">2.0"</span>
            </div>
          </div>
          <div className="mt-auto">
            <button className="w-full bg-primary text-primary-on font-bold py-2 rounded-md hover:opacity-90 transition-opacity shadow-sm">
              Calculate Yardage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockWorktableMockup() {
  return (
    <div className="w-full h-full bg-surface-container-low flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-10 bg-white border-b border-surface-container flex items-center px-4 justify-between z-10 shrink-0">
        <div className="text-[10px] font-bold text-secondary bg-surface-container px-2 py-1 rounded">Drafting: Custom_Star.qc</div>
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded hover:bg-primary/10 flex items-center justify-center text-primary cursor-pointer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12h14"/></svg></div>
          <div className="w-5 h-5 rounded hover:bg-surface-container flex items-center justify-center text-secondary cursor-pointer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Toolbar */}
        <div className="w-12 bg-white border-r border-surface-container py-2 flex flex-col items-center gap-3 shrink-0 z-10">
          <div className="w-8 h-8 rounded-lg hover:bg-surface-container text-secondary flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 3 21 12 3 21 3 3"/></svg></div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg></div>
          <div className="w-8 h-8 rounded-lg text-secondary hover:bg-surface-container flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#fdfbf7] relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--color-outline-variant) 1px, transparent 1px)', backgroundSize: '10px 10px', opacity: 0.3 }} />
          
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="relative w-64 h-64 bg-white shadow-md border border-outline-variant/30 flex items-center justify-center"
          >
             <svg viewBox="0 0 100 100" className="w-full h-full">
               {/* Grid lines inside block */}
               <path d="M25 0 V100 M50 0 V100 M75 0 V100 M0 25 H100 M0 50 H100 M0 75 H100" stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
               
               {/* Being Drafted */}
               <polygon points="50,0 100,50 50,100 0,50" fill="var(--color-primary-container)" opacity="0.4" />
               <polygon points="50,0 75,25 50,50 25,25" fill="var(--color-primary)" opacity="0.8" />
               <polygon points="50,50 75,75 50,100 25,75" fill="var(--color-primary-dark)" opacity="0.8" />
               
               {/* Drawing Line */}
               <line x1="25" y1="25" x2="10" y2="10" stroke="var(--color-error)" strokeWidth="1.5" />
               <circle cx="25" cy="25" r="2" fill="white" stroke="var(--color-primary)" strokeWidth="1" />
               <circle cx="10" cy="10" r="2" fill="var(--color-error)" />
               <circle cx="50" cy="0" r="2" fill="white" stroke="var(--color-primary)" strokeWidth="1" />
               <circle cx="50" cy="50" r="2" fill="white" stroke="var(--color-primary)" strokeWidth="1" />
             </svg>
             
             {/* Tooltip */}
             <div className="absolute top-2 left-2 bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded shadow-xl">
               Snap to Grid (Intersect)
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ImageWorktableMockup() {
  return (
    <div className="w-full h-full bg-surface-container-low flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-10 bg-white border-b border-surface-container flex items-center px-4 justify-between z-10 shrink-0">
        <div className="text-[10px] font-bold text-secondary bg-surface-container px-2 py-1 rounded">Fabric: Vintage_Floral.jpg</div>
        <div className="flex gap-2">
          <div className="px-2 py-1 bg-primary text-primary-on text-[10px] font-bold rounded cursor-pointer shadow-sm hover:opacity-90">Save Fabric</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Canvas */}
        <div className="flex-1 bg-surface-container-highest relative flex items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-72 h-48 bg-white shadow-xl overflow-hidden"
          >
            {/* Simulated Fabric Image */}
            <div className="absolute inset-0 opacity-80" style={{ 
              backgroundColor: '#e6d5c3',
              backgroundImage: 'radial-gradient(#ab7746 2px, transparent 2px), radial-gradient(#ab7746 2px, transparent 2px)',
              backgroundSize: '30px 30px',
              backgroundPosition: '0 0, 15px 15px'
            }} />
            
            {/* Calibration overlay */}
            <div className="absolute inset-0 bg-black/40 z-10" />
            <motion.div 
              animate={{ width: ['40%', '42%', '40%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] z-20 outline outline-2 outline-white"
              style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}
            >
              <div className="w-full h-full border border-white/50" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '33.33% 33.33%' }} />
              {/* Crop Handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-gray-300" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-gray-300" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-gray-300" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-gray-300" />
            </motion.div>
          </motion.div>
        </div>

        {/* Right Panel */}
        <div className="w-48 bg-white border-l border-surface-container p-3 shrink-0 z-10 flex flex-col gap-4 text-xs">
           <div>
            <div className="font-bold text-on-surface mb-2">Real Width Calibration</div>
            <p className="text-[9px] text-secondary mb-2 leading-tight">Drag the crop box to cover exactly exactly 1 inch of physical fabric.</p>
            <div className="h-7 bg-surface-container rounded border border-outline-variant/30 flex items-center px-2 text-on-surface font-mono justify-between">
              <span>Width</span>
              <span>1.0"</span>
            </div>
          </div>
          <div>
            <div className="font-bold text-on-surface mb-2">Adjustments</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] text-secondary mb-1"><span>Brightness</span><span>+12</span></div>
                <div className="h-1 bg-surface-container rounded overflow-hidden"><div className="w-[60%] h-full bg-primary" /></div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-secondary mb-1"><span>Contrast</span><span>-5</span></div>
                <div className="h-1 bg-surface-container rounded overflow-hidden"><div className="w-[45%] h-full bg-primary" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const tabs = [
  {
    id: 'quilt',
    label: 'Quilt Worktable',
    caption: 'Dynamic grid and sash layouts out of the box.',
    component: <QuiltWorktableMockup />,
  },
  {
    id: 'block',
    label: 'Block Worktable',
    caption: 'Snap-to-grid drafting logic for custom blocks.',
    component: <BlockWorktableMockup />,
  },
  {
    id: 'image',
    label: 'Image Worktable',
    caption: 'Calibrate imported fabrics to real-world scale.',
    component: <ImageWorktableMockup />,
  },
];

export default function WorkspacePreview() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-[8rem] bg-surface relative px-4 text-center overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.6 }}
        >
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold leading-[1.1] tracking-[-0.01em] text-on-surface mb-6">
            A deeply considered <br/>environment
          </h2>
          <p className="text-secondary mb-16 max-w-2xl mx-auto text-lg">
            Purpose-built workspaces that let you focus on the task at hand without losing sight of the big picture.
          </p>
        </motion.div>

        {/* Interactive Workspace Component */}
        <div className="glass-card rounded-[2rem] p-4 md:p-6 shadow-[var(--shadow-elevation-3)] border border-surface-container mx-auto max-w-5xl bg-white/40">
           
           {/* Tab Controls */}
           <div className="flex flex-wrap items-center justify-center gap-2 pb-6">
             {tabs.map((tab, idx) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(idx)}
                 className={`relative px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                   activeTab === idx 
                     ? 'text-primary-on' 
                     : 'text-secondary hover:text-on-surface hover:bg-white/50'
                 }`}
               >
                 {activeTab === idx && (
                   <motion.div 
                     layoutId="activeTabPill"
                     className="absolute inset-0 bg-primary rounded-full shadow-sm"
                     transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                   />
                 )}
                 <span className="relative z-10">{tab.label}</span>
               </button>
             ))}
           </div>

           {/* Perspective Container for Mockup */}
           <div className="relative perspective-1000">
             <motion.div 
               className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden border border-white/60 shadow-2xl bg-surface"
               initial={false}
               animate={{ rotateX: [1, 0, 1] }}
               transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
             >
               {/* Browser Chrome for the Mockup */}
               <div className="absolute top-0 left-0 right-0 h-8 bg-surface-container-high border-b border-black/5 flex items-center px-3 gap-2 z-50">
                 <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
                 <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
                 <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
                 <div className="flex-1 text-center">
                   <div className="mx-auto w-48 h-5 bg-white/50 rounded-md text-[9px] font-mono text-secondary flex items-center justify-center border border-black/5">
                     app.quiltcorgi.com/{tabs[activeTab].id}
                   </div>
                 </div>
               </div>

               <div className="absolute inset-x-0 bottom-0 top-8 bg-surface-container-low">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={activeTab}
                     initial={{ opacity: 0, y: 10, scale: 0.98 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: -10, scale: 0.98 }}
                     transition={{ duration: 0.4 }}
                     className="w-full h-full"
                   >
                     {tabs[activeTab].component}
                   </motion.div>
                 </AnimatePresence>
               </div>
             </motion.div>
             
             {/* Dynamic Caption */}
             <div className="mt-8">
               <AnimatePresence mode="wait">
                 <motion.p
                   key={activeTab}
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -5 }}
                   className="text-lg font-medium text-secondary"
                 >
                   {tabs[activeTab].caption}
                 </motion.p>
               </AnimatePresence>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
}
