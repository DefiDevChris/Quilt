/**
 * Memory manager for OpenCV Mat objects.
 *
 * Every cv.Mat() allocation must go through create() or adopt().
 * Every pipeline handler ends with reg.deleteAll() in a finally block.
 * This prevents WASM heap leaks from orphaned Mats.
 */
export class MatRegistry {
  private mats: Map<string, unknown> = new Map();

  constructor(private cv: unknown) {}

  /** Allocate a new Mat and track it by name. */
  create(name: string, ...args: unknown[]): unknown {
    if (this.mats.has(name)) {
      throw new Error(`MatRegistry: "${name}" already exists`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mat = new (this.cv as any).Mat(...args);
    this.mats.set(name, mat);
    return mat;
  }

  /** Adopt an existing Mat instance (e.g. returned from a cv function). */
  adopt(name: string, mat: unknown): unknown {
    if (this.mats.has(name)) {
      throw new Error(`MatRegistry: "${name}" already exists`);
    }
    this.mats.set(name, mat);
    return mat;
  }

  /** Get a tracked Mat by name. Throws if not found. */
  get(name: string): unknown {
    const m = this.mats.get(name);
    if (!m) {
      throw new Error(`MatRegistry: "${name}" not found`);
    }
    return m;
  }

  /** Delete a single Mat by name. Safe to call if already deleted. */
  delete(name: string): void {
    const m = this.mats.get(name);
    if (m) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m as any).delete();
      this.mats.delete(name);
    }
  }

  /** Delete all tracked Mats and clear the registry. */
  deleteAll(): void {
    for (const m of this.mats.values()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m as any).delete();
    }
    this.mats.clear();
  }
}
