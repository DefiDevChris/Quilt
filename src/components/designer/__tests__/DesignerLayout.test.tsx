// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DesignerLayout } from '@/components/designer/DesignerLayout';
import type { Project } from '@/types/project';

// Mock CanvasContext
const mockGetCanvas = vi.fn(() => null);
vi.mock('@/contexts/CanvasContext', () => ({
  CanvasProvider: ({ children }: { children: React.ReactNode }) => children,
  useCanvasContext: () => ({ getCanvas: mockGetCanvas }),
}));

// Mock DesignerAutoSave
vi.mock('@/hooks/useDesignerAutoSave', () => ({
  useDesignerAutoSave: vi.fn(),
}));

// Mock MyBlocksPanel
vi.mock('@/components/designer/MyBlocksPanel', () => ({
  MyBlocksPanel: () => (
    <div data-testid="my-blocks-panel">
      <h2>My Blocks</h2>
    </div>
  ),
}));

// Mock DesignerCanvasWorkspace
vi.mock('@/components/designer/DesignerCanvasWorkspace', () => ({
  DesignerCanvasWorkspace: ({ project }: { project: Project }) => (
    <div data-testid="designer-canvas-workspace">
      <span>Canvas: {project.name}</span>
    </div>
  ),
}));

// Mock SashingBorderPanel
vi.mock('@/components/designer/SashingBorderPanel', () => ({
  SashingBorderPanel: () => (
    <div data-testid="sashing-border-panel">
      <h3>Sashing & Borders</h3>
      <label>Sashing Width</label>
      <label>Sashing Fabric</label>
      <label>Border Width</label>
      <label>Border Fabric</label>
    </div>
  ),
}));

// Mock ExportButton
vi.mock('@/components/designer/ExportButton', () => ({
  ExportButton: () => <button>Export</button>,
}));

function makeMockProject(): Project {
  return {
    id: 'test-design-1',
    userId: 'user-1',
    name: 'Test Quilt Design',
    description: null,
    canvasData: {},
    worktables: [],
    unitSystem: 'imperial',
    gridSettings: { showGrid: true, snapToGrid: true, gridSize: 1 },
    fabricPresets: [],
    canvasWidth: 60,
    canvasHeight: 80,
    thumbnailUrl: null,
    isPublic: false,
    lastSavedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Project;
}

describe('DesignerLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the project name in the top bar', () => {
    const project = makeMockProject();
    render(<DesignerLayout project={project} />);
    expect(screen.getByText('Test Quilt Design')).toBeDefined();
  });

  it('renders the three-panel structure (blocks, canvas, sashing/borders)', () => {
    const project = makeMockProject();
    render(<DesignerLayout project={project} />);
    expect(screen.getByTestId('my-blocks-panel')).toBeDefined();
    expect(screen.getByTestId('designer-canvas-workspace')).toBeDefined();
    expect(screen.getByTestId('sashing-border-panel')).toBeDefined();
  });

  it('renders sashing and border configuration inputs', () => {
    const project = makeMockProject();
    render(<DesignerLayout project={project} />);
    expect(screen.getByText('Sashing Width')).toBeDefined();
    expect(screen.getByText('Sashing Fabric')).toBeDefined();
    expect(screen.getByText('Border Width')).toBeDefined();
    expect(screen.getByText('Border Fabric')).toBeDefined();
  });

  it('renders Export button', () => {
    const project = makeMockProject();
    render(<DesignerLayout project={project} />);
    expect(screen.getByRole('button', { name: 'Export' })).toBeDefined();
  });
});
