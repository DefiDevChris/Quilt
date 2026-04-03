import { z } from 'zod';

// --- Schemas ---

export const FaqCategorySchema = z.enum(['getting-started', 'design-tools', 'export', 'account']);

export type FaqCategory = z.infer<typeof FaqCategorySchema>;

export const FaqEntrySchema = z.object({
  id: z.string(),
  category: FaqCategorySchema,
  title: z.string(),
  content: z.string(),
});

export type FaqEntry = z.infer<typeof FaqEntrySchema>;

export const KeyboardShortcutSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
});

export type KeyboardShortcut = z.infer<typeof KeyboardShortcutSchema>;

// --- Keyboard Shortcuts ---

export const KEYBOARD_SHORTCUTS: readonly KeyboardShortcut[] = [
  { key: 'V', label: 'V', description: 'Select tool' },
  { key: 'R', label: 'R', description: 'Rectangle tool' },
  { key: 'T', label: 'T', description: 'Triangle tool' },
  { key: 'P', label: 'P', description: 'Polygon tool' },
  { key: 'L', label: 'L', description: 'Line tool' },
  { key: 'X', label: 'X', description: 'Text tool' },
  { key: 'B', label: 'B', description: 'Toggle Block Library' },
  { key: 'F', label: 'F', description: 'Toggle Fabric Library' },
  { key: 'Ctrl+Z', label: 'Ctrl+Z', description: 'Undo' },
  { key: 'Ctrl+Shift+Z', label: 'Ctrl+Shift+Z', description: 'Redo' },
  { key: 'Ctrl+C', label: 'Ctrl+C', description: 'Copy selected objects' },
  { key: 'Ctrl+V', label: 'Ctrl+V', description: 'Paste copied objects' },
  { key: 'Ctrl+D', label: 'Ctrl+D', description: 'Duplicate selection' },
  { key: 'Delete', label: 'Delete', description: 'Delete selected objects' },
  { key: 'Ctrl+A', label: 'Ctrl+A', description: 'Select all objects' },
  { key: 'Space+Drag', label: 'Space+Drag', description: 'Pan canvas' },
  { key: 'Scroll', label: 'Scroll', description: 'Zoom in/out' },
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
    id: 'gs-2',
    category: 'getting-started',
    title: 'What are the four worktables for?',
    content:
      'Each worktable handles a different part of your quilting workflow. Quilt is for full layouts, Block is for drafting individual blocks, Image is for working with fabric photos, and Print is for exporting your finished patterns.',
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
      'Switch to the Block worktable and use BlockBuilder for seam-line block drafting, Freeform for total creative freedom, or Applique for layered shapes.',
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
    title: 'What is foundation paper piecing (FPP)?',
    content:
      'FPP is a sewing technique that uses paper templates for precise piecing. QuiltCorgi generates printable FPP templates with seam allowances and sewing order marked right on them.',
  },
  // Account
  {
    id: 'ac-1',
    category: 'account',
    title: 'What do I get with Pro?',
    content:
      'Pro gives you unlimited projects, the full Fabric Library, Photo-to-Pattern, FPP template generation, and PDF export.',
  },
  {
    id: 'ac-2',
    category: 'account',
    title: 'How do I upgrade to Pro?',
    content:
      'Click your avatar in the top-right corner and select "Upgrade to Pro." You can start with a free trial to try everything out before committing.',
  },
  {
    id: 'ac-3',
    category: 'account',
    title: 'Can I cancel anytime?',
    content:
      'Absolutely. Go to Settings > Subscription and click "Cancel." Your Pro features stay active through the end of your billing period.',
  },
] as const;

// --- Contextual help by active tool ---

const CONTEXTUAL_HELP: Readonly<Record<string, string>> = {
  select:
    'Click to select, drag to move. Hold Shift to grab multiple pieces. Use corner handles to resize.',
  rectangle: 'Click and drag to draw a rectangle. Hold Shift for a perfect square.',
  triangle: 'Click and drag to draw a triangle. Release to place it on your canvas.',
  polygon:
    'Click and drag to draw a polygon. Adjust the number of sides in the panel on the right.',
  line: 'Click and drag for a straight line. Hold Shift to snap to 45-degree angles.',
  text: 'Click anywhere on your canvas to place a text label. Adjust font, size, and color in the panel on the right.',
  easydraw: 'Place grid points, then draw seam lines between them to draft your own block designs.',
  eyedropper: 'Click any patch to pick up its color, then apply that color to other patches.',
  spraycan:
    'Click patches to fill them with the current color. Hold and drag to color continuously.',
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

export function getFaqByCategory(category: FaqCategory): readonly FaqEntry[] {
  return FAQ_ENTRIES.filter((entry) => entry.category === category);
}

export const FAQ_CATEGORY_LABELS: Readonly<Record<FaqCategory, string>> = {
  'getting-started': 'Getting Started',
  'design-tools': 'Design Tools',
  export: 'Export',
  account: 'Account',
};
