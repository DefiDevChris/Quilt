import { describe, expect, it } from 'vitest';
import { sha256Base64 } from '@/lib/photo-to-design/stages/hash';

describe('sha256Base64', () => {
  it('returns the same hash for identical input', async () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);
    const ha = await sha256Base64(a);
    const hb = await sha256Base64(b);
    expect(ha).toBe(hb);
  });

  it('returns different hashes for different input', async () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 4]);
    expect(await sha256Base64(a)).not.toBe(await sha256Base64(b));
  });

  it('produces a valid base64 string of the expected SHA-256 length', async () => {
    const h = await sha256Base64(new Uint8Array([0]));
    // SHA-256 = 32 bytes; base64-encoded with padding = 44 chars.
    expect(h).toHaveLength(44);
    expect(h).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('accepts Uint8ClampedArray (used by ImageData)', async () => {
    const clamped = new Uint8ClampedArray([7, 8, 9]);
    const plain = new Uint8Array([7, 8, 9]);
    expect(await sha256Base64(clamped)).toBe(await sha256Base64(plain));
  });

  it('hashes over logical bytes, not the underlying buffer', async () => {
    // Views offset into a larger buffer must hash as if they stood alone.
    const big = new Uint8Array([0, 0, 1, 2, 3, 0, 0]);
    const view = new Uint8Array(big.buffer, 2, 3);
    const solo = new Uint8Array([1, 2, 3]);
    expect(await sha256Base64(view)).toBe(await sha256Base64(solo));
  });
});
