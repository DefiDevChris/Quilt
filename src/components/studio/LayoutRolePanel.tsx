'use client';

import { useCanvasStore } from '@/stores/canvasStore';

type LayoutRole = 'block' | 'sashing' | 'border' | 'edging';

interface RoleOption {
  id: LayoutRole;
  label: string;
  description: string;
  color: string;
  borderColor: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'block',
    label: 'Block',
    description: 'A block cell — assign quilt blocks here',
    color: 'rgba(255, 255, 255, 0.85)',
    borderColor: '#8B8B8B',
  },
  {
    id: 'sashing',
    label: 'Sashing',
    description: 'Strips between blocks',
    color: '#E8E2D8',
    borderColor: '#B0A898',
  },
  {
    id: 'border',
    label: 'Border',
    description: 'Border strips around the quilt',
    color: '#C8D8E8',
    borderColor: '#A0B0C0',
  },
  {
    id: 'edging',
    label: 'Edging',
    description: 'Outermost edge of the quilt',
    color: '#3D3D3D',
    borderColor: '#2A2A2A',
  },
];

export function LayoutRolePanel() {
  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const hasSelection = selectedObjectIds.length > 0;

  const handleAssignRole = (role: LayoutRole) => {
    if (!fabricCanvas || selectedObjectIds.length === 0) return;

    const option = ROLE_OPTIONS.find((r) => r.id === role);
    if (!option) return;

    for (const id of selectedObjectIds) {
      const obj = fabricCanvas.getObjects().find(
        (o) => (o as unknown as { id?: string }).id === id
      );
      if (obj) {
        // Tag the object with the layout role
        (obj as unknown as { layoutRole: string }).layoutRole = role;
        // Apply role color
        obj.set({
          fill: option.color,
          stroke: option.borderColor,
          strokeWidth: 1.5,
        } as Record<string, unknown>);
      }
    }
    fabricCanvas.renderAll();
  };

  const getCurrentRole = (): LayoutRole | null => {
    if (!fabricCanvas || selectedObjectIds.length === 0) return null;
    const obj = fabricCanvas.getObjects().find(
      (o) => (o as unknown as { id?: string }).id === selectedObjectIds[0]
    );
    if (!obj) return null;
    return ((obj as unknown as { layoutRole?: string }).layoutRole as LayoutRole) ?? null;
  };

  const currentRole = hasSelection ? getCurrentRole() : null;

  if (!hasSelection) {
    return (
      <div className="p-4">
        <p className="text-xs text-secondary text-center">
          Draw shapes on the canvas, then select one to assign its role.
        </p>
        <div className="mt-4 space-y-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Layout Roles
          </h4>
          {ROLE_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-center gap-2 px-2 py-1.5">
              <span
                className="w-4 h-4 rounded-sm border shrink-0"
                style={{ backgroundColor: option.color, borderColor: option.borderColor }}
              />
              <div>
                <span className="text-xs font-medium text-on-surface">{option.label}</span>
                <p className="text-[10px] text-secondary">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <p className="text-xs text-secondary mb-3">
        {selectedObjectIds.length === 1
          ? 'Assign a role to this piece:'
          : `Assign a role to ${selectedObjectIds.length} pieces:`}
      </p>

      <div className="space-y-1.5">
        {ROLE_OPTIONS.map((option) => {
          const isActive = currentRole === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleAssignRole(option.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white'
                  : 'border border-outline-variant/30 hover:border-primary text-on-surface'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-sm border shrink-0 ${isActive ? 'border-white/50' : ''}`}
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : option.color,
                  borderColor: isActive ? 'rgba(255,255,255,0.5)' : option.borderColor,
                }}
              />
              <div>
                <span className="text-sm font-medium">{option.label}</span>
                <p className={`text-[10px] ${isActive ? 'text-white/80' : 'text-secondary'}`}>
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {currentRole && (
        <div className="mt-3 pt-3 border-t border-outline-variant/20">
          <p className="text-[10px] text-secondary">
            Currently: <span className="font-medium text-on-surface capitalize">{currentRole}</span>
          </p>
        </div>
      )}
    </div>
  );
}
