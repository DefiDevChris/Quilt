import { describe, it, expect } from 'vitest';
import {
  createInitialPipeline,
  advancePipelineStep,
} from '@/lib/photo-pattern-engine';

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
