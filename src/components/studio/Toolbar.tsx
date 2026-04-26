'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ToolbarProps {
  side: 'left' | 'right';
  mode: 'template' | 'layout' | 'freeform';
}

type LeftTab = 'fabrics' | 'blocks' | 'layers';

export default function Toolbar({ side, mode }: ToolbarProps) {
  const [activeTab, setActiveTab] = useState<LeftTab>('fabrics');

  if (side === 'right') {
    return (
      <aside className="w-64 border-l bg-background flex flex-col shrink-0 overflow-y-auto">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Properties</p>
        </div>
        <div className="p-3 text-sm text-muted-foreground">
          Select an object to edit its properties.
        </div>
      </aside>
    );
  }

  // Left toolbar
  const tabs: { id: LeftTab; label: string }[] = [
    { id: 'fabrics', label: 'Fabrics' },
    // Block Builder tab — only for layout and freeform modes
    ...(mode !== 'template' ? [{ id: 'blocks' as LeftTab, label: 'Block Builder' }] : []),
    { id: 'layers', label: 'Layers' },
  ];

  return (
    <aside className="w-64 border-r bg-background flex flex-col shrink-0">
      {/* Tab strip */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'fabrics' && (
          <p className="text-sm text-muted-foreground">Drag fabrics onto the canvas.</p>
        )}
        {activeTab === 'blocks' && mode !== 'template' && (
          <p className="text-sm text-muted-foreground">Choose a block pattern to stamp onto the canvas.</p>
        )}
        {activeTab === 'layers' && (
          <p className="text-sm text-muted-foreground">No layers yet.</p>
        )}
      </div>
    </aside>
  );
}
