/**
 * Extracts the embedded WASM binary from @techstark/opencv-js and creates:
 *   public/opencv/opencv.js   — stripped JS (~220KB vs 10.4MB)
 *   public/opencv/opencv.wasm — standalone WASM binary (~7.6MB)
 *
 * This avoids the browser having to base64-decode ~8MB of WASM inside a
 * 10.4MB JS file, which causes tab crashes due to excessive memory usage.
 * The separated .wasm is fetched efficiently via WebAssembly.instantiateStreaming.
 *
 * Run: node scripts/extract-opencv-wasm.mjs
 * Called automatically by the postinstall npm script.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const srcPath = join(projectRoot, 'node_modules/@techstark/opencv-js/dist/opencv.js');
const outDir = join(projectRoot, 'public/opencv');

mkdirSync(outDir, { recursive: true });

const src = readFileSync(srcPath, 'utf8');

// Find the base64 data URI that contains the embedded WASM
const match = src.match(/wasmBinaryFile="data:application\/octet-stream;base64,([^"]+)"/);
if (!match) {
  console.error('ERROR: Could not find embedded WASM binary in opencv.js');
  process.exit(1);
}

// Extract and save the WASM binary
const wasmBuf = Buffer.from(match[1], 'base64');
writeFileSync(join(outDir, 'opencv.wasm'), wasmBuf);

// Create stripped JS: replace the data URI with just the filename.
// When loaded via <script src="/opencv/opencv.js">, the Emscripten locateFile
// function prepends scriptDirectory ("/opencv/") to get "/opencv/opencv.wasm".
const stripped = src.replace(
  /wasmBinaryFile="data:application\/octet-stream;base64,[^"]+"/,
  'wasmBinaryFile="opencv.wasm"'
);
writeFileSync(join(outDir, 'opencv.js'), stripped);

const savedMB = ((src.length - stripped.length) / 1024 / 1024).toFixed(1);
console.log(`opencv-wasm: extracted ${(wasmBuf.length / 1024 / 1024).toFixed(1)}MB .wasm`);
console.log(`opencv-wasm: stripped JS ${(src.length / 1024 / 1024).toFixed(1)}MB → ${(stripped.length / 1024 / 1024).toFixed(1)}MB (saved ${savedMB}MB)`);
