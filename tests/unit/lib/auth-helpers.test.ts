import { describe, it, expect } from 'vitest';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-responses';

describe('auth-helpers response factories', () => {
  it('unauthorizedResponse returns 401', async () => {
    const res = unauthorizedResponse();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('forbiddenResponse returns 403 with default message', async () => {
    const res = forbiddenResponse();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN');
    expect(body.error).toContain('access');
  });

  it('forbiddenResponse returns 403 with custom message', async () => {
    const res = forbiddenResponse('Custom forbidden');
    const body = await res.json();
    expect(body.error).toBe('Custom forbidden');
  });

  it('notFoundResponse returns 404', async () => {
    const res = notFoundResponse();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('validationErrorResponse returns 422', async () => {
    const res = validationErrorResponse('Invalid field');
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toBe('Invalid field');
  });

  it('errorResponse returns custom status and code', async () => {
    const res = errorResponse('Too many requests', 'RATE_LIMITED', 429);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(body.error).toBe('Too many requests');
  });
});
