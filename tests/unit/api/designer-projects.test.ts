import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('@/lib/db', () => {
  const mockDb = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-proj' }]),
      }),
    }),
  };
  return { db: mockDb };
});

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

vi.mock('@/lib/role-utils', () => ({
  isPro: (role: string) => role === 'pro' || role === 'admin',
}));

import { getRequiredSession } from '@/lib/auth-helpers';

describe('Designer Projects API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/designer/projects', () => {
    it('returns 401 without auth', async () => {
      vi.mocked(getRequiredSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/designer/projects/route');

      const request = new Request('http://localhost/api/designer/projects');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/designer/projects', () => {
    it('returns 401 without auth', async () => {
      vi.mocked(getRequiredSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/designer/projects/route');

      const request = new Request('http://localhost/api/designer/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 201 on valid input', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@test.com', role: 'pro', name: '', image: null, privacyMode: 'public' as const },
      };
      vi.mocked(getRequiredSession).mockResolvedValue(mockSession);

      const { POST } = await import('@/app/api/designer/projects/route');

      const request = new Request('http://localhost/api/designer/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Design' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });
});
