import { describe, it, expect } from 'vitest';
import {
  createInitialPipeline,
  advancePipelineStep,
  downscaleIfNeeded,
} from '@/lib/photo-pattern-engine';
import { PHOTO_PATTERN_DOWNSCALE_MAX } from '@/lib/constants';

// ── createInitialPipeline ──────────────────────────────────────

describe('createInitialPipeline', () => {
  it('returns 6 steps all pending', () => {
    const steps = createInitialPipeline();

    expect(steps).toHaveLength(6);
    for (const step of steps) {
      expect(step.status).toBe('pending');
    }
  });

  it('returns step names in the correct order', () => {
    const steps = createInitialPipeline();

    const expectedNames = [
      'Preprocessing image...',
      'Detecting grid structure...',
      'Finding seam lines...',
      'Identifying pieces...',
      'Extracting colors...',
      'Finalizing...',
    ];

    expect(steps.map((s) => s.name)).toEqual(expectedNames);
  });
});

// ── advancePipelineStep ────────────────────────────────────────

describe('advancePipelineStep', () => {
  it('sets the target step to the given status', () => {
    const initial = createInitialPipeline();

    const updated = advancePipelineStep(initial, 0, 'running');

    expect(updated[0].status).toBe('running');
  });

  it('preserves other steps unchanged', () => {
    const initial = createInitialPipeline();

    const updated = advancePipelineStep(initial, 2, 'complete');

    expect(updated[0].status).toBe('pending');
    expect(updated[1].status).toBe('pending');
    expect(updated[2].status).toBe('complete');
    expect(updated[3].status).toBe('pending');
    expect(updated[4].status).toBe('pending');
    expect(updated[5].status).toBe('pending');
  });

  it('handles error status with a message', () => {
    const initial = createInitialPipeline();

    const updated = advancePipelineStep(initial, 3, 'error', 'Detection failed');

    expect(updated[3].status).toBe('error');
    expect(updated[3].message).toBe('Detection failed');
  });

  it('does not mutate the original array', () => {
    const initial = createInitialPipeline();

    const updated = advancePipelineStep(initial, 0, 'running');

    expect(initial[0].status).toBe('pending');
    expect(updated).not.toBe(initial);
  });
});

// ── downscaleIfNeeded ──────────────────────────────────────────

describe('downscaleIfNeeded', () => {
  it('returns original dimensions when within limit', () => {
    const result = downscaleIfNeeded(800, 600);

    expect(result).toEqual({ width: 800, height: 600, scaled: false });
  });

  it('scales down proportionally when width exceeds the limit', () => {
    const result = downscaleIfNeeded(4000, 2000);

    expect(result.width).toBe(PHOTO_PATTERN_DOWNSCALE_MAX);
    expect(result.height).toBe(1000);
    expect(result.scaled).toBe(true);
  });

  it('scales down proportionally when height exceeds the limit', () => {
    const result = downscaleIfNeeded(1000, 3000);

    expect(result.width).toBe(Math.round(1000 * (PHOTO_PATTERN_DOWNSCALE_MAX / 3000)));
    expect(result.height).toBe(PHOTO_PATTERN_DOWNSCALE_MAX);
    expect(result.scaled).toBe(true);
  });

  it('scales a square image correctly', () => {
    const result = downscaleIfNeeded(4000, 4000);

    expect(result.width).toBe(PHOTO_PATTERN_DOWNSCALE_MAX);
    expect(result.height).toBe(PHOTO_PATTERN_DOWNSCALE_MAX);
    expect(result.scaled).toBe(true);
  });

  it('accepts a custom maxDimension override', () => {
    const result = downscaleIfNeeded(2000, 1000, 500);

    expect(result.width).toBe(500);
    expect(result.height).toBe(250);
    expect(result.scaled).toBe(true);
  });

  it('does not scale when dimensions exactly equal the limit', () => {
    const result = downscaleIfNeeded(PHOTO_PATTERN_DOWNSCALE_MAX, 1000);

    expect(result).toEqual({
      width: PHOTO_PATTERN_DOWNSCALE_MAX,
      height: 1000,
      scaled: false,
    });
  });
});
