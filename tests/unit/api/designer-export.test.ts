import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('@/lib/auth-helpers', () => ({
  getRequiredSession: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
  validationErrorResponse: (msg: string) => new Response(JSON.stringify({ error: msg }), { status: 422 }),
  errorResponse: (msg: string, code: string, status: number) => new Response(JSON.stringify({ error: msg, code }), { status }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, retryAfterMs: 0 }),
  API_RATE_LIMITS: { projects: { limit: 20, windowMs: 60_000 } },
  rateLimitResponse: (ms: number) => new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }),
}));

import { getRequiredSession } from '@/lib/auth-helpers';

describe('POST /api/designer/export/image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    vi.mocked(getRequiredSession).mockResolvedValue(null);

    const { POST } = await import('@/app/api/designer/export/image/route');

    const request = new Request('http://localhost/api/designer/export/image', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'data:image/png;base64,abc', format: 'png' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns exported image as downloadable file', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@test.com', role: 'pro' },
    };
    vi.mocked(getRequiredSession).mockResolvedValue(mockSession);

    const { POST } = await import('@/app/api/designer/export/image/route');

    // Valid base64 PNG data (minimal 1x1 pixel)
    const imageData =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const request = new Request('http://localhost/api/designer/export/image', {
      method: 'POST',
      body: JSON.stringify({
        imageData,
        format: 'png',
        filename: 'my-design',
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Content-Disposition')).toContain('my-design.png');
  });

  it('returns JPEG when format is jpeg', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@test.com', role: 'pro' },
    };
    vi.mocked(getRequiredSession).mockResolvedValue(mockSession);

    const { POST } = await import('@/app/api/designer/export/image/route');

    const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

    const request = new Request('http://localhost/api/designer/export/image', {
      method: 'POST',
      body: JSON.stringify({
        imageData,
        format: 'jpeg',
        filename: 'my-design',
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('Content-Disposition')).toContain('my-design.jpg');
  });

  it('returns 422 on invalid input', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@test.com', role: 'pro' },
    };
    vi.mocked(getRequiredSession).mockResolvedValue(mockSession);

    const { POST } = await import('@/app/api/designer/export/image/route');

    const request = new Request('http://localhost/api/designer/export/image', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(422);
  });
});
