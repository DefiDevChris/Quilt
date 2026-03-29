/**
 * Parse PDF quilt patterns into validated JSON using Kimi K2.5 (OpenAI-compatible API).
 *
 * Reads PDF files from a local directory, extracts text via pdf-parse,
 * sends the text to Kimi K2.5 for structured extraction, validates results
 * against ParsedPatternSchema, and writes JSON to src/data/patterns/.
 *
 * Usage:
 *   npx tsx scripts/parse-patterns.ts
 *   npx tsx scripts/parse-patterns.ts --skip-existing
 *   npx tsx scripts/parse-patterns.ts --file "Winter Jewels Quilt.pdf"
 *
 * Required environment variables:
 *   MOONSHOT_API_KEY — Kimi / Moonshot API key
 *
 * Optional environment variables:
 *   LLM_BASE_URL — API base URL (defaults to https://api.moonshot.cn/v1)
 *   LLM_MODEL — Model ID (defaults to kimi-k2.5)
 *   PATTERN_PDF_DIR — Input directory (defaults to ~/Downloads/quilting-graphics/andover-patterns/)
 *
 * Requires: npm install -D pdf-parse
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';
import { ParsedPatternSchema } from '../src/lib/pattern-parser-types';
import { stripBranding, stripPatternName } from '../src/lib/pattern-branding-strip';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PATTERN_PDF_DIR =
  process.env.PATTERN_PDF_DIR ?? '/home/chrishoran/Downloads/quilting-graphics/andover-patterns/';
const OUTPUT_DIR = resolve(__dirname, '../src/data/patterns');
const FAILED_DIR = join(OUTPUT_DIR, '_failed');
const EXAMPLE_DIR = resolve(__dirname, '../src/data/patterns');

const LLM_BASE_URL = process.env.LLM_BASE_URL ?? 'https://api.kimi.com/coding/v1';
const LLM_MODEL = process.env.LLM_MODEL ?? 'kimi-for-coding';
const LLM_MAX_TOKENS = 16384;
const LLM_TEMPERATURE = 0;

const RATE_LIMIT_DELAY_MS = 1000;
const RETRY_BACKOFF_MS = 5000;

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { skipExisting: boolean; singleFile: string | null } {
  const args = process.argv.slice(2);
  let skipExisting = false;
  let singleFile: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skip-existing') {
      skipExisting = true;
    } else if (args[i] === '--file' && i + 1 < args.length) {
      singleFile = args[i + 1]!;
      i++;
    }
  }

  return { skipExisting, singleFile };
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

function slugify(filename: string): string {
  return basename(filename, extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// PDF text extraction
// ---------------------------------------------------------------------------

async function extractPdfText(filePath: string): Promise<{ text: string; pageCount: number }> {
  // pdf-parse v2 — npm install -D pdf-parse
  const { PDFParse } = await import('pdf-parse');
  const buffer = readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  await (parser as unknown as { load(): Promise<void> }).load();
  const info = await parser.getInfo();
  const textResult = await parser.getText();
  parser.destroy();

  return {
    text: (textResult as { text: string }).text,
    pageCount: info.total as number,
  };
}

// ---------------------------------------------------------------------------
// Few-shot examples (loaded at runtime)
// ---------------------------------------------------------------------------

function loadFewShotExamples(): { winterJewels: string; buildingBlocks: string } {
  const winterJewelsPath = join(EXAMPLE_DIR, 'winter-jewels-quilt.json');
  const buildingBlocksPath = join(EXAMPLE_DIR, 'building-blocks-quilt.json');

  return {
    winterJewels: readFileSync(winterJewelsPath, 'utf-8'),
    buildingBlocks: readFileSync(buildingBlocksPath, 'utf-8'),
  };
}

// ---------------------------------------------------------------------------
// Type definition for the prompt
// ---------------------------------------------------------------------------

const PARSED_PATTERN_TYPE = `interface ParsedPiece {
  fabricLabel: string;
  shape: 'square' | 'rectangle' | 'hst' | 'qst' | 'strip' | 'triangle' | 'custom';
  cutWidth: number;
  cutHeight: number;
  quantity: number;
  specialInstructions?: string;
}

interface ParsedBlock {
  name: string;
  finishedWidth: number;
  finishedHeight: number;
  quantity: number;
  pieces: ParsedPiece[];
}

interface ParsedFabric {
  label: string;
  name: string;
  role: 'background' | 'blocks' | 'border' | 'binding' | 'backing' | 'sashing' | 'accent';
  yardage: number;
  sku?: string;
  colorFamily?: string;
  matchedFabricId?: string;
}

interface ParsedLayout {
  type: 'grid' | 'on-point' | 'medallion' | 'lone-star' | 'custom';
  rows?: number;
  cols?: number;
  sashingWidth?: number;
  borderWidths?: number[];
}

interface CuttingDirection {
  scope: 'per-block' | 'whole-quilt';
  blockName?: string;
  fabricLabel: string;
  instructions: string[];
}

interface ParsedPattern {
  id: string;
  name: string;
  description: string;
  skillLevel: 'beginner' | 'confident-beginner' | 'intermediate' | 'advanced';
  finishedWidth: number;
  finishedHeight: number;
  blocks: ParsedBlock[];
  fabrics: ParsedFabric[];
  layout: ParsedLayout;
  cuttingDirections: CuttingDirection[];
  assemblySteps: string[];
  sourceFilename: string;
  pageCount: number;
  isQuilt: boolean;
  parseConfidence: number;
}`;

// ---------------------------------------------------------------------------
// LLM API call (OpenAI-compatible — works with Kimi K2.5, OpenRouter, etc.)
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message: string; type?: string };
}

async function callLlmApi(
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const body = {
    model: LLM_MODEL,
    max_tokens: LLM_MAX_TOKENS,
    temperature: LLM_TEMPERATURE,
    messages: [{ role: 'system' as const, content: systemPrompt }, ...messages],
  };

  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'claude-code/2.1.86',
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429 || response.status >= 500) {
    const statusText = response.statusText;
    throw new RetryableError(`API returned ${response.status} ${statusText}`);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;

  if (data.error) {
    throw new Error(`LLM API error: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in LLM API response');
  }

  return content;
}

class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

// ---------------------------------------------------------------------------
// Build the extraction prompt
// ---------------------------------------------------------------------------

function buildExtractionPrompt(
  pdfText: string,
  sourceFilename: string,
  pageCount: number,
  examples: { winterJewels: string; buildingBlocks: string }
): ChatMessage[] {
  const userPrompt = `Extract structured data from the following quilt pattern PDF text and return it as a single JSON object conforming to the ParsedPattern TypeScript interface below.

## TypeScript Type Definition

\`\`\`typescript
${PARSED_PATTERN_TYPE}
\`\`\`

## Instructions

1. Extract ALL data from the PDF text — blocks, fabrics, cutting directions, assembly steps, layout, and measurements.
2. Set \`id\` to a URL-safe slug derived from the pattern name (lowercase, hyphens for spaces, no special characters).
3. Set \`sourceFilename\` to: "${sourceFilename}"
4. Set \`pageCount\` to: ${pageCount}
5. Set \`isQuilt\` to \`false\` for non-quilt items such as totes, stockings, advent calendars, pillows, table runners, or bags. Set to \`true\` for quilts.
6. Use DECIMAL numbers for ALL measurements (e.g., 2.5 not "2 1/2", 6.875 not "6 7/8").
7. Assign \`parseConfidence\` between 0 and 1:
   - 1.0 = very confident, all data clearly extracted
   - 0.7-0.9 = mostly confident, minor uncertainties
   - 0.5-0.7 = significant uncertainties or missing data
   - Below 0.5 = many uncertainties, missing sections
8. For \`shape\` classification on pieces:
   - 'square': equal width and height
   - 'rectangle': unequal width and height, not a strip
   - 'hst': half-square triangle (two triangles from a square)
   - 'qst': quarter-square triangle (four triangles from a square)
   - 'strip': length is greater than 4x width
   - 'triangle': standalone triangle piece
   - 'custom': any other shape
9. Include \`specialInstructions\` on pieces when the pattern describes a non-standard technique (stitch-and-flip, sub-cutting, etc.).
10. For fabrics, assign \`role\` based on how the fabric is used (background, blocks, border, binding, backing, sashing, accent).
11. Include \`sku\` on fabrics when a product code or SKU is mentioned in the pattern.

## Example Output (Winter Jewels Quilt)

\`\`\`json
${examples.winterJewels}
\`\`\`

## PDF Text Content

\`\`\`
${pdfText}
\`\`\`

Respond with ONLY the valid JSON object. Do not include markdown code fences, explanatory text, or any other content — just the raw JSON.`;

  return [{ role: 'user', content: userPrompt }];
}

// ---------------------------------------------------------------------------
// JSON extraction from response
// ---------------------------------------------------------------------------

function extractJson(responseText: string): string {
  // Try to parse as-is first
  let cleaned = responseText.trim();

  // Strip markdown code fences if present despite instructions
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}

// ---------------------------------------------------------------------------
// Post-processing
// ---------------------------------------------------------------------------

function postProcess(parsed: Record<string, unknown>): Record<string, unknown> {
  const name =
    typeof parsed.name === 'string' ? stripPatternName(stripBranding(parsed.name)) : parsed.name;

  const description =
    typeof parsed.description === 'string' ? stripBranding(parsed.description) : parsed.description;

  const assemblySteps = Array.isArray(parsed.assemblySteps)
    ? parsed.assemblySteps.map((step: unknown) =>
        typeof step === 'string' ? stripBranding(step) : step
      )
    : parsed.assemblySteps;

  return {
    ...parsed,
    name,
    description,
    assemblySteps,
  };
}

// ---------------------------------------------------------------------------
// Sleep utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Process a single PDF
// ---------------------------------------------------------------------------

interface ProcessResult {
  filename: string;
  success: boolean;
  confidence?: number;
  error?: string;
  skipped?: boolean;
}

async function processPdf(
  filePath: string,
  apiKey: string,
  examples: { winterJewels: string; buildingBlocks: string },
  skipExisting: boolean
): Promise<ProcessResult> {
  const filename = basename(filePath);
  const slug = slugify(filename);
  const outputPath = join(OUTPUT_DIR, `${slug}.json`);

  // Check for existing output
  if (skipExisting && existsSync(outputPath)) {
    console.log(`  [SKIP] ${filename} (output exists)`);
    return { filename, success: true, skipped: true };
  }

  // Extract text from PDF
  let pdfText: string;
  let pageCount: number;

  try {
    const extracted = await extractPdfText(filePath);
    pdfText = extracted.text;
    pageCount = extracted.pageCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  [FAIL] ${filename}: PDF extraction failed — ${message}`);
    return { filename, success: false, error: `PDF extraction failed: ${message}` };
  }

  if (!pdfText.trim()) {
    console.error(`  [FAIL] ${filename}: PDF text is empty`);
    return { filename, success: false, error: 'PDF text is empty (possibly image-only PDF)' };
  }

  // Build prompt and call LLM
  const systemPrompt =
    'You are a quilt pattern data extraction expert. Extract structured data from quilt pattern PDFs into JSON format. Be precise with measurements and quantities.';
  const messages = buildExtractionPrompt(pdfText, filename, pageCount, examples);

  let responseText: string;

  try {
    responseText = await callLlmWithRetry(apiKey, systemPrompt, messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  [FAIL] ${filename}: LLM API call failed — ${message}`);
    return { filename, success: false, error: `LLM API error: ${message}` };
  }

  // Parse JSON response
  let rawParsed: Record<string, unknown>;

  try {
    const jsonText = extractJson(responseText);
    rawParsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  [FAIL] ${filename}: JSON parse failed — ${message}`);
    saveFailedResult(slug, responseText);
    return { filename, success: false, error: `JSON parse error: ${message}` };
  }

  // Post-process (strip branding)
  const processed = postProcess(rawParsed);

  // Validate against Zod schema
  const result = ParsedPatternSchema.safeParse(processed);

  if (!result.success) {
    const errorMessage = result.error.message;
    console.error(`  [FAIL] ${filename}: Zod validation error — ${errorMessage}`);
    saveFailedResult(slug, JSON.stringify(processed, null, 2));
    return { filename, success: false, error: `Zod validation error: ${errorMessage}` };
  }

  // Write validated JSON
  writeFileSync(outputPath, JSON.stringify(result.data, null, 2) + '\n', 'utf-8');

  const confidence = result.data.parseConfidence;
  console.log(`  [OK] ${filename} -> ${slug}.json (confidence: ${confidence})`);

  return { filename, success: true, confidence };
}

// ---------------------------------------------------------------------------
// Retry wrapper for LLM API
// ---------------------------------------------------------------------------

async function callLlmWithRetry(
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  try {
    return await callLlmApi(apiKey, systemPrompt, messages);
  } catch (error) {
    if (error instanceof RetryableError) {
      console.log(`    Retrying after ${RETRY_BACKOFF_MS}ms...`);
      await sleep(RETRY_BACKOFF_MS);
      return await callLlmApi(apiKey, systemPrompt, messages);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Save failed results for debugging
// ---------------------------------------------------------------------------

function saveFailedResult(slug: string, content: string): void {
  if (!existsSync(FAILED_DIR)) {
    mkdirSync(FAILED_DIR, { recursive: true });
  }

  const failedPath = join(FAILED_DIR, `${slug}.raw.json`);
  writeFileSync(failedPath, content, 'utf-8');
  console.log(`    Raw response saved to ${failedPath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const apiKey =
    process.env.MOONSHOT_API_KEY ??
    'sk-kimi-ddylQcDrYZgYxGCB7Tmv27TqAvWtuUhM4SEgEdkrtZpgY2Q88whaq7zVIdavU06H';

  const { skipExisting, singleFile } = parseArgs();

  console.log('Pattern Parser');
  console.log('==============');
  console.log(`Input:  ${PATTERN_PDF_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);

  if (skipExisting) {
    console.log('Mode:   --skip-existing');
  }

  if (singleFile) {
    console.log(`File:   --file "${singleFile}"`);
  }

  if (!existsSync(PATTERN_PDF_DIR)) {
    throw new Error(`Input directory not found: ${PATTERN_PDF_DIR}`);
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load few-shot examples
  const examples = loadFewShotExamples();

  // Discover PDFs
  let pdfFiles: string[];

  if (singleFile) {
    const fullPath = join(PATTERN_PDF_DIR, singleFile);

    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    pdfFiles = [fullPath];
  } else {
    pdfFiles = readdirSync(PATTERN_PDF_DIR)
      .filter((f) => f.toLowerCase().endsWith('.pdf'))
      .sort()
      .map((f) => join(PATTERN_PDF_DIR, f));
  }

  if (pdfFiles.length === 0) {
    throw new Error(`No PDF files found in ${PATTERN_PDF_DIR}`);
  }

  console.log(`\nFound ${pdfFiles.length} PDF(s)\n`);

  // Process sequentially to respect API rate limits
  const results: ProcessResult[] = [];

  for (let i = 0; i < pdfFiles.length; i++) {
    const filePath = pdfFiles[i]!;
    console.log(`[${i + 1}/${pdfFiles.length}] ${basename(filePath)}`);

    const result = await processPdf(filePath, apiKey, examples, skipExisting);
    results.push(result);

    // Rate limit between API calls (skip if this was a cached/skipped result)
    if (i < pdfFiles.length - 1 && !result.skipped) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  // Summary
  const skipped = results.filter((r) => r.skipped).length;
  const succeeded = results.filter((r) => r.success && !r.skipped).length;
  const failed = results.filter((r) => !r.success).length;
  const failures = results.filter((r) => !r.success);

  console.log('\nParse Complete');
  console.log('==============');
  console.log(`Total PDFs:     ${pdfFiles.length}`);
  console.log(`Processed:      ${pdfFiles.length - skipped}`);
  console.log(`Skipped:        ${skipped} (existing)`);
  console.log(`Succeeded:      ${succeeded}`);
  console.log(`Failed:         ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailures:');

    for (const failure of failures) {
      console.log(`  - ${failure.filename}: ${failure.error}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
