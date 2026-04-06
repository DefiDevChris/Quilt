'use client';

/* ── Custom SVG Icons ──────────────────────────────────────────────── */

function CameraPatternIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="6" y="12" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="26" r="8" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="26" r="3" fill="currentColor" opacity="0.3" />
      <path
        d="M16 12L18 7H30L32 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 22L10 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M4 30L10 28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M44 22L38 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M44 30L38 28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function QuiltBlocksIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="5" y="5" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <rect x="27" y="5" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <rect x="5" y="27" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <rect x="27" y="27" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <polygon points="9,9 17,13 9,17" fill="currentColor" opacity="0.25" />
      <polygon points="31,9 39,13 31,17" fill="currentColor" opacity="0.25" />
      <polygon points="9,31 17,35 9,39" fill="currentColor" opacity="0.25" />
      <rect x="30" y="30" width="10" height="10" rx="1" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function NewCanvasIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <line
        x1="24"
        y1="16"
        x2="24"
        y2="32"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="24"
        x2="32"
        y2="24"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M14 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M24 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M34 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

interface QuickStartWorkflowsProps {
  onPhotoToDesign: () => void;
  onStartFromTemplate: () => void;
  onBlankProject: () => void;
  isPro: boolean;
}

export function QuickStartWorkflows({
  onPhotoToDesign,
  onStartFromTemplate,
  onBlankProject,
  isPro,
}: QuickStartWorkflowsProps) {
  return (
    <section className="mb-8" aria-label="Quick start workflows">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">
        Quick Start
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Photo to Design */}
        <button
          type="button"
          onClick={onPhotoToDesign}
          className="min-h-[120px] rounded-xl p-6 text-left overflow-hidden group cursor-pointer transition-all duration-200 bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(198,123,92,0.1)] flex items-center justify-between gap-4"
          aria-label="Photo to Design workflow"
        >
          <div>
            <p className="text-on-surface font-extrabold text-xl mb-1">Photo to Design</p>
            <p className="text-secondary text-sm">Extract blocks with AI</p>
          </div>
          <CameraPatternIcon className="w-12 h-12 text-warm-terracotta shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Start from Template */}
        <button
          type="button"
          onClick={onStartFromTemplate}
          className="min-h-[120px] rounded-xl p-6 text-left overflow-hidden group cursor-pointer transition-all duration-200 bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(198,123,92,0.1)] flex items-center justify-between gap-4"
          aria-label="Start from template workflow"
        >
          <div>
            <p className="text-on-surface font-extrabold text-xl mb-1">Start from Template</p>
            <p className="text-secondary text-sm">Patterns and blocks</p>
          </div>
          <QuiltBlocksIcon className="w-12 h-12 text-warm-terracotta shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Blank Project */}
        <button
          type="button"
          onClick={onBlankProject}
          className="min-h-[120px] rounded-xl p-6 text-left overflow-hidden group cursor-pointer transition-all duration-200 bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(198,123,92,0.1)] flex items-center justify-between gap-4"
          aria-label="Create blank project workflow"
        >
          <div>
            <p className="text-on-surface font-extrabold text-xl mb-1">Blank Project</p>
            <p className="text-secondary text-sm">Design from scratch</p>
          </div>
          <NewCanvasIcon className="w-12 h-12 text-warm-terracotta shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </section>
  );
}
