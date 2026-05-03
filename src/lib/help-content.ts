import { z } from 'zod';

export const FaqCategorySchema = z.enum([
  'getting-started',
  'design-tools',
  'export',
  'account',
  'sharing',
]);

export type FaqCategory = z.infer<typeof FaqCategorySchema>;

export const FaqEntrySchema = z.object({
  id: z.string(),
  category: FaqCategorySchema,
  title: z.string(),
  content: z.string(),
});

export type FaqEntry = z.infer<typeof FaqEntrySchema>;

export type KeyboardShortcut = {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly category: 'tools' | 'editing' | 'panels' | 'canvas';
};

// --- Keyboard Shortcuts ---

export const KEYBOARD_SHORTCUTS: readonly KeyboardShortcut[] = [
  { key: 'V', label: 'V', description: 'Select tool', category: 'tools' },
  { key: 'R', label: 'R', description: 'Rectangle tool', category: 'tools' },
  { key: 'T', label: 'T', description: 'Triangle tool', category: 'tools' },
  { key: 'B', label: 'B', description: 'Toggle Block Library', category: 'panels' },
  { key: 'F', label: 'F', description: 'Toggle Fabric Library', category: 'panels' },
  { key: '?', label: '?', description: 'Show keyboard shortcuts', category: 'panels' },
  { key: 'Ctrl+Z', label: 'Ctrl+Z', description: 'Undo', category: 'editing' },
  { key: 'Ctrl+Shift+Z', label: 'Ctrl+Shift+Z', description: 'Redo', category: 'editing' },
  { key: 'Ctrl+C', label: 'Ctrl+C', description: 'Copy selected objects', category: 'editing' },
  { key: 'Ctrl+V', label: 'Ctrl+V', description: 'Paste copied objects', category: 'editing' },
  { key: 'Ctrl+D', label: 'Ctrl+D', description: 'Duplicate selection', category: 'editing' },
  { key: 'Delete', label: 'Delete', description: 'Delete selected objects', category: 'editing' },
  { key: 'Ctrl+A', label: 'Ctrl+A', description: 'Select all objects', category: 'editing' },
  { key: 'Space+Drag', label: 'Space+Drag', description: 'Pan canvas', category: 'canvas' },
  { key: 'Scroll', label: 'Scroll', description: 'Zoom in/out', category: 'canvas' },
] as const;

// --- FAQ Entries ---

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  // Getting Started
  {
    id: 'gs-1',
    category: 'getting-started',
    title: 'How do I start a new quilt?',
    content:
      'Head to your dashboard and click "New Project." Give it a name, set your quilt size, and you\'ll land right in the design studio ready to go.',
  },
  {
    id: 'gs-3',
    category: 'getting-started',
    title: 'How do I add blocks to my quilt?',
    content:
      'Open the Block Library (click the diamond icon or press B). Browse by category or search for a specific block, then drag it right onto your canvas.',
  },
  {
    id: 'gs-4',
    category: 'getting-started',
    title: 'Do I need to save my work?',
    content:
      "Your project auto-saves as you work, so you won't lose anything. You can also save manually anytime with Ctrl+S.",
  },
  // Design Tools
  {
    id: 'dt-1',
    category: 'design-tools',
    title: 'How do I change fabric colors on my quilt?',
    content:
      'Select a patch on the canvas and use the color picker in the panel on the right. You can also drag fabrics straight from the Fabric Library onto any patch.',
  },
  {
    id: 'dt-4',
    category: 'design-tools',
    title: 'Can I draw my own custom blocks?',
    content:
      'Switch to the Block Builder worktable to draft custom blocks using the pencil, rectangle, triangle, and circle tools. Draw seam lines, edit nodes, and save your creation to the library.',
  },
  {
    id: 'dt-5',
    category: 'design-tools',
    title: 'How do I set up a grid layout?',
    content:
      'Click the Layout Settings icon (four squares) in the toolbar. Pick your layout type — Grid, Sashing, or On-Point — and adjust from there.',
  },
  // Export
  {
    id: 'ex-1',
    category: 'export',
    title: 'How do I export my quilt as a PDF?',
    content:
      'Click the Printlist icon in the toolbar, then select "Generate PDF." Your PDF includes block overviews, cutting diagrams, and yardage estimates — ready for the sewing room.',
  },
  {
    id: 'ex-2',
    category: 'export',
    title: 'Can I save my design as an image?',
    content:
      'Click the Export Image icon in the toolbar. Pick your resolution and format (PNG or JPEG), then hit Export. Great for sharing your work online.',
  },
  {
    id: 'ex-3',
    category: 'export',
    title: 'What is included in the PDF export?',
    content:
      'The PDF export generates a complete pattern document with a cover page, fabric requirements, cutting directions, block assembly instructions, quilt diagram, and 1:1 cutting templates with seam allowance.',
  },
  // Account
  {
    id: 'ac-1',
    category: 'account',
    title: 'Do I need an account to use QuiltCorgi?',
    content:
      "You can explore the block and fabric libraries without signing in, but you'll need a free account to save projects, create print lists, and download PDFs.",
  },
  // Sharing
  {
    id: 'sh-1',
    category: 'sharing',
    title: 'How do I share my design?',
    content:
      'Click "Share" in the Studio top bar, toggle "Public Link" on, then copy the share link. Anyone with the link can view your design without signing in.',
  },
  {
    id: 'sh-2',
    category: 'sharing',
    title: 'Can others edit my shared design?',
    content:
      'No. Shared links are read-only. Viewers can see your quilt but cannot modify it. You can turn off sharing anytime by toggling "Public Link" off.',
  },
] as const;

// --- Contextual help by active tool ---

const CONTEXTUAL_HELP: Readonly<Record<string, string>> = {
  select:
    'Click to select, drag to move. Hold Shift to grab multiple pieces. Use corner handles to resize.',
  rectangle: 'Click and drag to draw a rectangle. Hold Shift for a perfect square.',
  triangle: 'Click and drag to draw a triangle. Release to place it on your canvas.',
  easydraw: 'Place grid points, then draw seam lines between them to draft your own block designs.',
};

// --- Public API ---

export function getContextualHelp(tool: string): string {
  return CONTEXTUAL_HELP[tool] ?? 'Select a tool to see contextual help.';
}

export function searchFaq(query: string): readonly FaqEntry[] {
  if (!query.trim()) {
    return FAQ_ENTRIES;
  }

  const lowerQuery = query.toLowerCase();
  return FAQ_ENTRIES.filter(
    (entry) =>
      entry.title.toLowerCase().includes(lowerQuery) ||
      entry.content.toLowerCase().includes(lowerQuery)
  );
}

export const FAQ_CATEGORY_LABELS: Readonly<Record<FaqCategory, string>> = {
  'getting-started': 'Getting Started',
  'design-tools': 'Design Tools',
  export: 'Export',
  account: 'Account',
  sharing: 'Sharing',
};


