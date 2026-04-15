/**
 * Run-length-encoded history of label maps.
 *
 * A label map for a 4000×3000 image is 48 MB raw. Large contiguous patches
 * compress 50:1–200:1 under RLE, so keeping 15 snapshots costs a few MB
 * instead of ~700. Each encoded snapshot is a flat sequence of
 * `(value: i32, runLength: u32)` pairs stored little-endian in a DataView.
 */

/** Encode an Int32Array as RLE pairs. */
export function rleEncode(labelMap: Int32Array): Uint8Array {
  const runs: Array<{ value: number; length: number }> = [];
  let i = 0;
  const n = labelMap.length;
  while (i < n) {
    const value = labelMap[i];
    let length = 1;
    // Cap each run at 0xFFFFFFFF to fit in u32.
    while (i + length < n && labelMap[i + length] === value && length < 0xffffffff) {
      length++;
    }
    runs.push({ value, length });
    i += length;
  }

  // 8 bytes per pair (i32 value + u32 length) + 4-byte header for `n`
  const buf = new ArrayBuffer(4 + runs.length * 8);
  const view = new DataView(buf);
  view.setUint32(0, n, true);
  let off = 4;
  for (const r of runs) {
    view.setInt32(off, r.value, true);
    view.setUint32(off + 4, r.length, true);
    off += 8;
  }
  return new Uint8Array(buf);
}

/** Decode an RLE snapshot into a pre-allocated Int32Array. */
export function rleDecodeInto(encoded: Uint8Array, dest: Int32Array): void {
  const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
  const n = view.getUint32(0, true);
  if (n !== dest.length) {
    throw new Error(`rleDecodeInto: destination size ${dest.length} != encoded size ${n}`);
  }
  let off = 4;
  let di = 0;
  while (off < encoded.byteLength) {
    const value = view.getInt32(off, true);
    const length = view.getUint32(off + 4, true);
    off += 8;
    for (let k = 0; k < length; k++) {
      dest[di++] = value;
    }
  }
  if (di !== n) {
    throw new Error(`rleDecodeInto: decoded ${di} values, expected ${n}`);
  }
}

/** Allocate a fresh Int32Array and decode into it. */
export function rleDecode(encoded: Uint8Array): Int32Array {
  const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
  const n = view.getUint32(0, true);
  const out = new Int32Array(n);
  rleDecodeInto(encoded, out);
  return out;
}

/**
 * 15-slot undo/redo history over label-map snapshots.
 *
 * - push() writes the CURRENT state after an edit.
 * - A new push after an undo truncates the redo tail.
 * - Snapshots are evicted from the bottom once the cap is exceeded.
 * - When the stack has exactly one snapshot (the original), undo is a no-op
 *   — the label map at push(0) IS the initial state, not a pre-edit state.
 */
export class LabelMapHistory {
  private stack: Uint8Array[] = [];
  private pointer = -1;
  private readonly maxSnapshots: number;

  constructor(maxSnapshots = 15) {
    this.maxSnapshots = maxSnapshots;
  }

  /** Reset all history. */
  reset(): void {
    this.stack = [];
    this.pointer = -1;
  }

  /** Store a snapshot of the current label map. Truncates any redo tail. */
  push(labelMap: Int32Array): void {
    // Drop anything ahead of the pointer (killed by a new edit).
    if (this.pointer < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.pointer + 1);
    }
    this.stack.push(rleEncode(labelMap));
    if (this.stack.length > this.maxSnapshots) {
      this.stack.shift();
    }
    this.pointer = this.stack.length - 1;
  }

  /** Step back one slot, decoding into dest. Returns false at head-of-stack. */
  undo(dest: Int32Array): boolean {
    if (this.pointer <= 0) return false;
    this.pointer--;
    rleDecodeInto(this.stack[this.pointer], dest);
    return true;
  }

  /** Step forward one slot, decoding into dest. Returns false at tail-of-stack. */
  redo(dest: Int32Array): boolean {
    if (this.pointer >= this.stack.length - 1) return false;
    this.pointer++;
    rleDecodeInto(this.stack[this.pointer], dest);
    return true;
  }

  get canUndo(): boolean {
    return this.pointer > 0;
  }

  get canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }

  get size(): number {
    return this.stack.length;
  }
}
