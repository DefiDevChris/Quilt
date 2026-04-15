// ============================================================================
// Seam Engine Sweep — synthetic fixture generation.
//
// The manual Playwright spec needs five deterministic PNGs. Rather than
// checking binaries into the repo, we synthesize them at test startup with
// `sharp` and drop them in a gitignored `.cache/` directory next to this
// file. Regenerating is cheap (<100 ms each) and keeps the repo lean.
//
// Real-quilt fixtures fall back to the existing `tests/fixtures/test-quilt*`
// images if present — the RFC calls out two real-quilt placeholders but they
// are out-of-scope to curate here; the synthetic three cover the engine's
// interesting edge cases (uniform, two-region, 8×8 tile grid).
// ============================================================================

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const FIXTURE_SIZE = 1024;

export interface FixtureDescriptor {
  /** Kebab-case filename stem (without `.png`). */
  name: string;
  /** Path to the generated PNG. */
  filePath: string;
}

/**
 * Materialize all five sweep fixtures in `<cacheDir>/` and return their
 * metadata. Idempotent — regenerates if a file is missing, leaves existing
 * files alone.
 */
export async function ensureFixtures(cacheDir: string): Promise<FixtureDescriptor[]> {
  await mkdir(cacheDir, { recursive: true });

  const descriptors: FixtureDescriptor[] = [
    { name: 'checker-8x8', filePath: path.join(cacheDir, 'checker-8x8.png') },
    { name: 'solid-red', filePath: path.join(cacheDir, 'solid-red.png') },
    { name: 'two-halves', filePath: path.join(cacheDir, 'two-halves.png') },
    { name: 'real-quilt-a', filePath: path.join(cacheDir, 'real-quilt-a.png') },
    { name: 'real-quilt-b', filePath: path.join(cacheDir, 'real-quilt-b.png') },
  ];

  for (const d of descriptors) {
    if (existsSync(d.filePath)) continue;
    const png = await renderFixture(d.name);
    await writeFile(d.filePath, png);
  }

  return descriptors;
}

async function renderFixture(name: string): Promise<Buffer> {
  switch (name) {
    case 'checker-8x8':
      return renderChecker(8);
    case 'solid-red':
      return renderSolid(220, 60, 60);
    case 'two-halves':
      return renderTwoHalves();
    case 'real-quilt-a':
      return renderPseudoQuilt(3);
    case 'real-quilt-b':
      return renderPseudoQuilt(4);
    default:
      throw new Error(`Unknown fixture: ${name}`);
  }
}

function renderChecker(cells: number): Promise<Buffer> {
  const size = FIXTURE_SIZE;
  const cellSize = size / cells;
  const pixels = new Uint8Array(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isDark = (Math.floor(x / cellSize) + Math.floor(y / cellSize)) % 2 === 0;
      const i = (y * size + x) * 3;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = isDark ? 40 : 230;
    }
  }
  return sharp(pixels, { raw: { width: size, height: size, channels: 3 } })
    .png({ compressionLevel: 6 })
    .toBuffer();
}

function renderSolid(r: number, g: number, b: number): Promise<Buffer> {
  const size = FIXTURE_SIZE;
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r, g, b },
    },
  })
    .png({ compressionLevel: 6 })
    .toBuffer();
}

function renderTwoHalves(): Promise<Buffer> {
  const size = FIXTURE_SIZE;
  const pixels = new Uint8Array(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isLeft = x < size / 2;
      const i = (y * size + x) * 3;
      if (isLeft) {
        pixels[i] = 220;
        pixels[i + 1] = 60;
        pixels[i + 2] = 60;
      } else {
        pixels[i] = 60;
        pixels[i + 1] = 120;
        pixels[i + 2] = 220;
      }
    }
  }
  return sharp(pixels, { raw: { width: size, height: size, channels: 3 } })
    .png({ compressionLevel: 6 })
    .toBuffer();
}

/**
 * Pseudo-quilt: a grid of random fabric-ish blocks. Not a real quilt photo,
 * but exercises the auto-segment's ability to produce many patches. Seed is
 * baked in so the image is deterministic across runs.
 */
function renderPseudoQuilt(seedSalt: number): Promise<Buffer> {
  const size = FIXTURE_SIZE;
  const cells = 8;
  const cellSize = size / cells;
  const pixels = new Uint8Array(size * size * 3);

  let rng = seedSalt * 2654435761;
  const next = () => {
    rng = (rng ^ (rng << 13)) >>> 0;
    rng = (rng ^ (rng >>> 17)) >>> 0;
    rng = (rng ^ (rng << 5)) >>> 0;
    return (rng & 0xffff) / 0xffff;
  };

  const palette: Array<[number, number, number]> = [];
  for (let i = 0; i < cells * cells; i++) {
    palette.push([
      Math.floor(60 + next() * 180),
      Math.floor(60 + next() * 180),
      Math.floor(60 + next() * 180),
    ]);
  }

  for (let y = 0; y < size; y++) {
    const cy = Math.floor(y / cellSize);
    for (let x = 0; x < size; x++) {
      const cx = Math.floor(x / cellSize);
      const [r, g, b] = palette[cy * cells + cx];
      const i = (y * size + x) * 3;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    }
  }

  return sharp(pixels, { raw: { width: size, height: size, channels: 3 } })
    .png({ compressionLevel: 6 })
    .toBuffer();
}
