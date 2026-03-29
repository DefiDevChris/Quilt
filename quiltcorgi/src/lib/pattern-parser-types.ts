import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────

export const SkillLevelSchema = z.enum([
  'beginner',
  'confident-beginner',
  'intermediate',
  'advanced',
]);

export const PieceShapeSchema = z.enum([
  'square',
  'rectangle',
  'hst',
  'qst',
  'strip',
  'triangle',
  'custom',
]);

export const FabricRoleSchema = z.enum([
  'background',
  'blocks',
  'border',
  'binding',
  'backing',
  'sashing',
  'accent',
]);

export const LayoutTypeSchema = z.enum(['grid', 'on-point', 'medallion', 'lone-star', 'custom']);

export const CuttingDirectionScopeSchema = z.enum(['per-block', 'whole-quilt']);

// ── Piece ─────────────────────────────────────────────────────────

export const ParsedPieceSchema = z.object({
  fabricLabel: z.string().min(1),
  shape: PieceShapeSchema,
  cutWidth: z.number().nonnegative(),
  cutHeight: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  specialInstructions: z.string().optional(),
});

export type ParsedPiece = z.infer<typeof ParsedPieceSchema>;

// ── Block ─────────────────────────────────────────────────────────

export const ParsedBlockSchema = z.object({
  name: z.string().min(1),
  finishedWidth: z.number().positive(),
  finishedHeight: z.number().positive(),
  quantity: z.number().int().positive(),
  pieces: z.array(ParsedPieceSchema),
});

export type ParsedBlock = z.infer<typeof ParsedBlockSchema>;

// ── Fabric ────────────────────────────────────────────────────────

export const ParsedFabricSchema = z.object({
  label: z.string().min(1),
  name: z.string().min(1),
  role: FabricRoleSchema,
  yardage: z.number().nonnegative(),
  sku: z.string().optional(),
  colorFamily: z.string().optional(),
  matchedFabricId: z.string().optional(),
});

export type ParsedFabric = z.infer<typeof ParsedFabricSchema>;

// ── Layout ────────────────────────────────────────────────────────

export const ParsedLayoutSchema = z.object({
  type: LayoutTypeSchema,
  rows: z.number().int().positive().optional(),
  cols: z.number().int().positive().optional(),
  sashingWidth: z.number().nonnegative().optional(),
  borderWidths: z.array(z.number().nonnegative()).optional(),
});

export type ParsedLayout = z.infer<typeof ParsedLayoutSchema>;

// ── Cutting Direction ─────────────────────────────────────────────

export const CuttingDirectionSchema = z.object({
  scope: CuttingDirectionScopeSchema,
  blockName: z.string().optional(),
  fabricLabel: z.string().min(1),
  instructions: z.array(z.string().min(1)),
});

export type CuttingDirection = z.infer<typeof CuttingDirectionSchema>;

// ── Parsed Pattern (top-level) ────────────────────────────────────

export const ParsedPatternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  skillLevel: SkillLevelSchema,
  finishedWidth: z.number().positive(),
  finishedHeight: z.number().positive(),
  blocks: z.array(ParsedBlockSchema),
  fabrics: z.array(ParsedFabricSchema),
  layout: ParsedLayoutSchema,
  cuttingDirections: z.array(CuttingDirectionSchema),
  assemblySteps: z.array(z.string().min(1)),
  sourceFilename: z.string().min(1),
  pageCount: z.number().int().positive(),
  isQuilt: z.boolean(),
  parseConfidence: z.number().min(0).max(1),
});

export type ParsedPattern = z.infer<typeof ParsedPatternSchema>;
