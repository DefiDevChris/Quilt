'use client';

import { useCallback, useEffect, useState } from 'react';

const ROLES = [
  { value: 'border', label: 'Border', color: '#9C6A3A' },
  { value: 'edging', label: 'Edging', color: '#6B7B8D' },
  { value: 'sashing', label: 'Sashing', color: '#B0A090' },
  { value: 'block-cell', label: 'Block Cell', color: '#4CAF50' },
  { value: 'cornerstone', label: 'Cornerstone', color: '#8B5E3C' },
  { value: 'custom', label: 'Custom Shape', color: '#9E9E9E' },
] as const;

interface LayoutRoleInspectorProps {
  readonly selectedObject: unknown | null;
  readonly onChange: () => void;
}

/**
 * Layout Role Inspector — assigns a semantic role to a selected shape in the
 * Layout Builder. The role determines how the shape behaves when the layout
 * is later used in a quilt project.
 */
export function LayoutRoleInspector({ selectedObject, onChange }: LayoutRoleInspectorProps) {
  const [currentRole, setCurrentRole] = useState<string>('');

  useEffect(() => {
    if (!selectedObject) {
      setCurrentRole('');
      return;
    }
    const rec = selectedObject as unknown as Record<string, unknown>;
    const role = (rec['_layoutRole'] as string) ?? '';
    setCurrentRole(role || 'custom');
  }, [selectedObject]);

  const handleRoleChange = useCallback(
    (role: string) => {
      if (!selectedObject) return;
      const rec = selectedObject as unknown as Record<string, unknown>;
      rec['_layoutRole'] = role;

      // Update visual styling based on role
      const roleDef = ROLES.find((r) => r.value === role);
      if (roleDef) {
        rec['stroke'] = roleDef.color;
        (selectedObject as { set?: (key: string, val: unknown) => void })?.set?.('stroke', roleDef.color);
      }

      setCurrentRole(role);
      onChange();
    },
    [selectedObject, onChange]
  );

  const handleDelete = useCallback(() => {
    if (!selectedObject) return;
    const rec = selectedObject as unknown as Record<string, unknown>;
    const canvas = rec['canvas'] as
      | { remove: (obj: unknown) => void; renderAll: () => void }
      | undefined;
    canvas?.remove(selectedObject);
    canvas?.renderAll();
  }, [selectedObject]);

  if (!selectedObject) {
    return (
      <div className="p-4 text-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-2 text-secondary opacity-40">
          <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
        <p className="text-xs text-secondary">Select a shape on the canvas to assign a role.</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* Current role */}
      <div>
        <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">Assign Role</p>
        <div className="space-y-1">
          {ROLES.map((role) => {
            const isActive = currentRole === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleChange(role.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${isActive
                  ? 'bg-primary/10 border border-primary/30 text-on-surface'
                  : 'bg-surface-container hover:bg-surface-container-high text-secondary'
                  }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: role.color }}
                />
                <span className="font-medium">{role.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dimensions info */}
      <div className="p-2 bg-surface-container rounded-lg">
        <p className="text-[10px] text-secondary mb-1">Dimensions</p>
        <p className="text-xs text-on-surface font-mono">
          {Math.round(selectedObject.width ?? 0)} × {Math.round(selectedObject.height ?? 0)} px
        </p>
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        className="w-full rounded-lg px-3 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors border border-error/20"
      >
        Delete Shape
      </button>
    </div>
  );
}
