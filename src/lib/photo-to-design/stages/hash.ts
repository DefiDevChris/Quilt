// ============================================================================
// SHA-256 hash over a pixel buffer.
//
// Used as the cache key for SAM2 image embeddings — encoding a 1024×1024 image
// takes seconds even on WebGPU, so re-running the pipeline with the same input
// (user adjusts grid then re-runs) must not pay that cost twice.
// ============================================================================

export async function sha256Base64(data: Uint8Array | Uint8ClampedArray): Promise<string> {
  // Build a fresh ArrayBuffer-backed view — `data.buffer` is typed as
  // `ArrayBuffer | SharedArrayBuffer` under strict lib types, which
  // `crypto.subtle.digest` won't accept. Allocating the ArrayBuffer
  // directly pins the type.
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return toBase64(new Uint8Array(hash));
}

function toBase64(bytes: Uint8Array): string {
  // Chunked to avoid blowing the argument limit on String.fromCharCode for
  // pathological input sizes (the SHA-256 output is only 32 bytes so this is
  // really just defensive, but cheap).
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
  }
  return btoa(parts.join(''));
}
