'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QUILT_SIZE_PRESETS, QuiltSizeKey } from '@/lib/quilt-size-presets';
import { useUserTemplates } from '@/hooks/useUserTemplates';
import type { UserTemplate } from '@/types/userTemplate';

interface SelectionShellProps {
  mode: 'template' | 'layout' | 'freeform';
  onStart: (config: {
    width: number;
    height: number;
    templateId?: string;
    fabricIds?: string[];
  }) => void;
}

// ---------------------------------------------------------------------------
// Sub-panel: Template picker
// ---------------------------------------------------------------------------
function TemplatePicker({ onPick }: { onPick: (t: UserTemplate) => void }) {
  const { templates, loading } = useUserTemplates();
  const [tab, setTab] = useState<'mine' | 'library'>('mine');

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'mine' | 'library')}>
        <TabsList>
          <TabsTrigger value="mine">My Templates</TabsTrigger>
          <TabsTrigger value="library">Template Library</TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved templates yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onPick(t)}
                  className="border rounded-lg p-3 text-left hover:bg-accent transition-colors"
                >
                  {t.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.thumbnail_url} alt={t.name} className="w-full aspect-square object-cover rounded mb-2" />
                  )}
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.width_in}&quot; × {t.height_in}&quot;
                  </p>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library">
          <p className="text-sm text-muted-foreground mt-2">Community templates coming soon.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-panel: Layout size picker
// ---------------------------------------------------------------------------
function LayoutSizePicker({ onPick }: { onPick: (w: number, h: number) => void }) {
  const [selected, setSelected] = useState<QuiltSizeKey | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Choose a standard quilt size:</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(QUILT_SIZE_PRESETS) as QuiltSizeKey[]).map((key) => {
          const { label, width, height } = QUILT_SIZE_PRESETS[key];
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`border rounded-lg p-3 text-left transition-colors ${
                selected === key ? 'border-primary bg-primary/5' : 'hover:bg-accent'
              }`}
            >
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{width}&quot; × {height}&quot;</p>
            </button>
          );
        })}
      </div>
      {selected && (
        <Button
          className="w-full mt-2"
          onClick={() => {
            const { width, height } = QUILT_SIZE_PRESETS[selected];
            onPick(width, height);
          }}
        >
          Start Designing
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-panel: Freeform size picker
// ---------------------------------------------------------------------------
function FreeformSizePicker({ onPick }: { onPick: (w: number, h: number) => void }) {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  const w = parseFloat(width);
  const h = parseFloat(height);
  const valid = !isNaN(w) && !isNaN(h) && w > 0 && h > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter custom quilt dimensions (inches):</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="ff-width">Width (in)</Label>
          <Input
            id="ff-width"
            type="number"
            min="1"
            placeholder="60"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ff-height">Height (in)</Label>
          <Input
            id="ff-height"
            type="number"
            min="1"
            placeholder="80"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
      </div>
      <Button className="w-full" disabled={!valid} onClick={() => onPick(w, h)}>
        Start Designing
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SelectionShell
// ---------------------------------------------------------------------------
export default function SelectionShell({ mode, onStart }: SelectionShellProps) {
  function handleTemplateSelect(t: UserTemplate) {
    onStart({
      width: t.width_in ?? 60,
      height: t.height_in ?? 80,
      templateId: t.id,
      fabricIds: t.fabric_ids ?? [],
    });
  }

  const title =
    mode === 'template' ? 'Choose a Template'
    : mode === 'layout'  ? 'Choose a Quilt Size'
    : 'Set Custom Dimensions';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This choice is locked once you start designing.
          </p>
        </div>

        {mode === 'template' && (
          <TemplatePicker onPick={handleTemplateSelect} />
        )}

        {mode === 'layout' && (
          <LayoutSizePicker onPick={(w, h) => onStart({ width: w, height: h })} />
        )}

        {mode === 'freeform' && (
          <FreeformSizePicker onPick={(w, h) => onStart({ width: w, height: h })} />
        )}
      </div>
    </div>
  );
}
