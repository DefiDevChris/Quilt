import { z } from 'zod';

// --- Schemas ---

export const FaqCategorySchema = z.enum([
  'getting-started',
  'design-tools',
  'export',
  'account',
]);

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
  { key: 'C', label: 'C', description: 'Bezier Curve tool' },
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
    title: 'How do I create a new quilt design?',
    content:
      'Go to your dashboard and click "New Project". Choose a project name and quilt size, then click Create. You will be taken to the design studio.',
  },
  {
    id: 'gs-2',
    category: 'getting-started',
    title: 'What are the four worktables?',
    content:
      'QUILT is for full quilt layouts. BLOCK is for designing individual blocks. IMAGE lets you trace reference photos. PRINT is for reviewing and exporting your project.',
  },
  {
    id: 'gs-3',
    category: 'getting-started',
    title: 'How do I add blocks to my quilt?',
    content:
      'Open the Block Library by clicking the diamond icon (or press B). Browse or search for a block, then drag it onto your canvas.',
  },
  {
    id: 'gs-4',
    category: 'getting-started',
    title: 'How do I save my work?',
    content:
      'Your project auto-saves as you work. You can also manually save using Ctrl+S or through the File menu.',
  },
  // Design Tools
  {
    id: 'dt-1',
    category: 'design-tools',
    title: 'How do I change fabric colors?',
    content:
      'Select a patch on the canvas, then use the color picker in the Context Panel on the right. You can also drag fabrics from the Fabric Library directly onto patches.',
  },
  {
    id: 'dt-2',
    category: 'design-tools',
    title: 'How do I use the Symmetry tool?',
    content:
      'Click the Symmetry icon in the toolbar. Choose vertical, horizontal, or radial symmetry. Draw in one section and your strokes mirror automatically.',
  },
  {
    id: 'dt-3',
    category: 'design-tools',
    title: 'What is the Serendipity Generator?',
    content:
      'Serendipity randomly shuffles fabric assignments across your quilt to discover unexpected color combinations. Click the sparkle icon to try it.',
  },
  {
    id: 'dt-4',
    category: 'design-tools',
    title: 'How do I draw custom blocks?',
    content:
      'Switch to the BLOCK worktable. Use EasyDraw for seam-line block drawing, Freeform for complete freedom, or Applique for layered shapes.',
  },
  {
    id: 'dt-5',
    category: 'design-tools',
    title: 'How do I use grid layouts?',
    content:
      'Click the Layout Settings icon (four squares) in the toolbar. Choose Grid, Sashing, On-Point, Medallion, or Lone Star layout types.',
  },
  // Export
  {
    id: 'ex-1',
    category: 'export',
    title: 'How do I export my quilt as a PDF?',
    content:
      'Click the Printlist icon in the toolbar, then select "Generate PDF". Your PDF will include block overviews, cutting diagrams, and yardage estimates.',
  },
  {
    id: 'ex-2',
    category: 'export',
    title: 'How do I export as an image?',
    content:
      'Click the Export Image icon (mountain landscape) in the toolbar. Choose your preferred resolution and format (PNG or JPEG), then click Export.',
  },
  {
    id: 'ex-3',
    category: 'export',
    title: 'What is foundation paper piecing (FPP)?',
    content:
      'FPP is a sewing technique using paper templates. QuiltCorgi can generate printable FPP templates for your blocks with seam allowances and sewing order.',
  },
  // Account
  {
    id: 'ac-1',
    category: 'account',
    title: 'What features require a Pro subscription?',
    content:
      'Pro unlocks unlimited projects, the Fabric Library, Symmetry and Serendipity tools, FPP templates, advanced layouts (Medallion, Lone Star), and PDF export.',
  },
  {
    id: 'ac-2',
    category: 'account',
    title: 'How do I upgrade to Pro?',
    content:
      'Click your avatar in the top-right corner and select "Upgrade to Pro". You can start with a free trial before committing to a subscription.',
  },
  {
    id: 'ac-3',
    category: 'account',
    title: 'Can I cancel my Pro subscription?',
    content:
      'Yes. Go to Settings > Subscription and click "Cancel". Your Pro features remain active until the end of your billing period.',
  },
] as const;

// --- Contextual help by active tool ---

const CONTEXTUAL_HELP: Readonly<Record<string, string>> = {
  select:
    'Click objects to select them. Drag to move. Hold Shift to select multiple objects. Use corner handles to resize.',
  rectangle:
    'Click and drag to draw a rectangle. Hold Shift for a perfect square. Release to place the shape.',
  triangle:
    'Click and drag to draw a triangle. The triangle is drawn from the click point. Release to place the shape.',
  polygon:
    'Click and drag to draw a polygon. Use the Context Panel to adjust the number of sides after drawing.',
  line: 'Click and drag to draw a straight line. Hold Shift to constrain to 45-degree angles.',
  curve:
    'Click to set the start point, drag to create the first control point, then click to set the end point.',
  text: 'Click on the canvas to place a text box. Type your text and use the Context Panel to adjust font, size, and color.',
  easydraw:
    'Click to place grid points, then draw lines between them to create seam-based block designs.',
  eyedropper:
    'Click on any patch to pick up its color. The selected color can then be applied to other patches.',
  spraycan:
    'Click on patches to apply the current color. Hold and drag for continuous application.',
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
