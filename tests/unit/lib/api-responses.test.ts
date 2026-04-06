import { describe, it, expect } from 'vitest';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-responses';
import type { ApiErrorCode } from '@/types/api';

describe('api-responses', () => {
  it('unauthorizedResponse returns 401', async () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json();
    expect(body.error).toBe('Authentication required');
  });

  it('forbiddenResponse returns 403', () => {
    const response = forbiddenResponse();
    expect(response.status).toBe(403);
  });

  it('forbiddenResponse accepts custom message', () => {
    const response = forbiddenResponse('Custom message');
    expect(response.status).toBe(403);
  });

  it('notFoundResponse returns 404', () => {
    const response = notFoundResponse();
    expect(response.status).toBe(404);
  });

  it('validationErrorResponse returns 422', () => {
    const response = validationErrorResponse('Invalid input');
    expect(response.status).toBe(422);
  });

  it('errorResponse accepts custom status and code', async () => {
    const response = errorResponse('Server error', 'INTERNAL_ERROR' as ApiErrorCode, 500);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Server error');
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
