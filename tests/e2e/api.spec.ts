import { test, expect } from '@playwright/test';

test.describe('API Rate Limiting', () => {
  test('rate limit headers are present', async ({ request }) => {
    const response = await request.get('/api/blog');
    expect(response.headers()['x-ratelimit-limit']).toBeTruthy();
  });

  test('rate limit enforced on auth endpoints', async ({ request }) => {
    // Make multiple requests quickly
    const requests = Array(10).fill(null).map(() =>
      request.post('/api/auth/signin', {
        data: { email: 'test@example.com', password: 'wrong' }
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status() === 429);
    expect(rateLimited).toBe(true);
  });
});

test.describe('API Authentication', () => {
  test('protected endpoints require auth', async ({ request }) => {
    const endpoints = [
      '/api/projects',
      '/api/blocks',
      '/api/fabrics'
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
    }
  });

  test('admin endpoints require admin role', async ({ request }) => {
    const endpoints = [
      '/api/admin/posts',
      '/api/blog'
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
    }
  });
});

test.describe('API Error Handling', () => {
  test('invalid JSON returns 400', async ({ request }) => {
    const response = await request.post('/api/projects', {
      data: 'invalid json',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(response.status()).toBe(400);
  });

  test('missing required fields returns 400', async ({ request }) => {
    const response = await request.post('/api/projects', {
      data: {}
    });
    expect(response.status()).toBe(400);
  });

  test('not found returns 404', async ({ request }) => {
    const response = await request.get('/api/projects/nonexistent-id');
    expect(response.status()).toBe(404);
  });
});

test.describe('API CORS', () => {
  test('CORS headers are present', async ({ request }) => {
    const response = await request.get('/api/blog');
    expect(response.headers()['access-control-allow-origin']).toBeTruthy();
  });
});

test.describe('API Content Security', () => {
  test('SVG sanitization on upload', async ({ request }) => {
    const maliciousSVG = '<svg><script>alert("xss")</script></svg>';
    const response = await request.post('/api/blocks', {
      data: { svg: maliciousSVG }
    });
    // Should either reject or sanitize
    expect([400, 401]).toContain(response.status());
  });
});

test.describe('Webhook Endpoints', () => {
  test('Stripe webhook requires signature', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: { type: 'test' }
    });
    expect(response.status()).toBe(400);
  });

  test('webhook validates signature', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: { type: 'test' },
      headers: { 'stripe-signature': 'invalid' }
    });
    expect(response.status()).toBe(400);
  });
});

test.describe('API Response Format', () => {
  test('blog API returns JSON', async ({ request }) => {
    const response = await request.get('/api/blog');
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('error responses have consistent format', async ({ request }) => {
    const response = await request.get('/api/projects/invalid');
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});

test.describe('API Pagination', () => {
  test('blog API supports pagination', async ({ request }) => {
    const response = await request.get('/api/blog?limit=5&offset=0');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

test.describe('API Search', () => {
  test('projects search endpoint exists', async ({ request }) => {
    const response = await request.get('/api/projects?search=test');
    expect([200, 401]).toContain(response.status());
  });

  test('blocks search endpoint exists', async ({ request }) => {
    const response = await request.get('/api/blocks?search=nine');
    expect([200, 401]).toContain(response.status());
  });
});

test.describe('API File Upload', () => {
  test('file upload has size limits', async ({ request }) => {
    // Create a large buffer (> 10MB)
    const largeFile = Buffer.alloc(11 * 1024 * 1024);
    const response = await request.post('/api/upload', {
      multipart: {
        file: {
          name: 'large.png',
          mimeType: 'image/png',
          buffer: largeFile
        }
      }
    });
    expect([400, 413]).toContain(response.status());
  });

  test('file upload validates mime types', async ({ request }) => {
    const response = await request.post('/api/upload', {
      multipart: {
        file: {
          name: 'test.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('test')
        }
      }
    });
    expect([400, 401, 415]).toContain(response.status());
  });
});
