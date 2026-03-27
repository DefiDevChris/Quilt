const previews = [
  {
    label: 'Quilt Worktable',
    caption: 'Design your layout',
  },
  {
    label: 'Block Worktable',
    caption: 'Draft with precision',
  },
  {
    label: 'Image Worktable',
    caption: 'Process fabric scans',
  },
];

export default function WorkspacePreview() {
  return (
    <section className="py-[5.5rem] bg-surface-container-low px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-[2rem] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface text-center mb-12">
          A workspace that gets out of the way
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previews.map((preview) => (
            <div key={preview.label} className="text-center">
              {/* Placeholder image */}
              <div className="aspect-[4/3] bg-surface-container rounded-[var(--radius-lg)] flex items-center justify-center mb-3">
                <div className="text-secondary">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <rect x="4" y="4" width="32" height="32" rx="4" />
                    <rect x="4" y="4" width="32" height="8" rx="4" />
                    <line x1="12" y1="16" x2="12" y2="36" />
                  </svg>
                </div>
              </div>
              <p className="text-[length:var(--font-size-label-sm)] font-medium text-on-surface">
                {preview.label}
              </p>
              <p className="text-[length:var(--font-size-label-sm)] text-secondary mt-0.5">
                {preview.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
