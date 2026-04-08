'use client';

/**
 * Layout Elements Library — draggable layout elements for the Layout Builder.
 * Each element can be dragged onto the canvas to create a pre-configured shape
 * with a default role already assigned.
 */
export function LayoutElementsLibrary() {
  const elements = [
    {
      id: 'border',
      name: 'Border (4")',
      description: 'Fills the outermost 4" of the quilt',
      color: '#9C6A3A',
      bg: 'rgba(156, 106, 58, 0.1)',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="2" y="2" width="24" height="24" rx="2" stroke="#9C6A3A" strokeWidth="3" />
          <rect x="6" y="6" width="16" height="16" rx="1" stroke="#D0C8BF" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      ),
    },
    {
      id: 'edging',
      name: 'Edging',
      description: 'Outermost decorative edge',
      color: '#6B7B8D',
      bg: 'rgba(107, 123, 141, 0.08)',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="1" y="1" width="26" height="26" rx="2" stroke="#6B7B8D" strokeWidth="2" strokeDasharray="3 2" />
          <rect x="4" y="4" width="20" height="20" rx="1" stroke="#9C6A3A" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'sashing',
      name: 'Sashing Strip',
      description: 'Spacer between blocks',
      color: '#B0A090',
      bg: 'rgba(176, 160, 144, 0.12)',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="10" width="22" height="8" rx="1" stroke="#B0A090" strokeWidth="1.5" fill="rgba(176,160,144,0.15)" />
        </svg>
      ),
    },
    {
      id: 'block-cell',
      name: 'Block Cell',
      description: 'Placeholder for a quilt block',
      color: '#4CAF50',
      bg: 'rgba(76, 175, 80, 0.06)',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="3" width="22" height="22" rx="2" stroke="#4CAF50" strokeWidth="1.5" fill="rgba(76,175,80,0.08)" />
          <path d="M14 8V20M8 14H20" stroke="#4CAF50" strokeWidth="1" strokeOpacity="0.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-3 space-y-2">
      {elements.map((el) => (
        <div
          key={el.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/quiltcorgi-layout-element', el.id);
            e.dataTransfer.effectAllowed = 'copy';
          }}
          className="flex items-start gap-3 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-grab active:cursor-grabbing border border-outline-variant/30"
        >
          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: el.bg }}>
            {el.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-on-surface">{el.name}</p>
            <p className="text-[11px] text-secondary leading-tight">{el.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
