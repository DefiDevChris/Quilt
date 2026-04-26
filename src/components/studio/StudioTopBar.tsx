'use client';

import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/stores/projectStore';

interface StudioTopBarProps {
  onSaveAsTemplate?: () => void;
  onClearFabrics?: () => void;
}

export default function StudioTopBar({ onSaveAsTemplate, onClearFabrics }: StudioTopBarProps) {
  const { mode } = useProjectStore();

  return (
    <header className="h-12 border-b flex items-center justify-between px-4 bg-background shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">Quilt Studio</span>
        {mode && (
          <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">
            {mode}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onClearFabrics && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFabrics}
            className="text-destructive hover:text-destructive"
          >
            Clear Fabrics
          </Button>
        )}
        {onSaveAsTemplate && (
          <Button variant="outline" size="sm" onClick={onSaveAsTemplate}>
            Save as Template
          </Button>
        )}
      </div>
    </header>
  );
}
