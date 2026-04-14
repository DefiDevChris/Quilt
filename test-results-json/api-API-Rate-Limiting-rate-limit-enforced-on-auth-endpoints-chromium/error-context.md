# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> API Rate Limiting >> rate limit enforced on auth endpoints
- Location: tests/e2e/api.spec.ts:9:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('API Rate Limiting', () => {
  4   |   test('rate limit headers are present', async ({ request }) => {
  5   |     const response = await request.get('/api/blog');
  6   |     expect(response.headers()['x-ratelimit-limit']).toBeTruthy();
  7   |   });
  8   | 
  9   |   test('rate limit enforced on auth endpoints', async ({ request }) => {
  10  |     // Make multiple requests quickly
  11  |     const requests = Array(10).fill(null).map(() =>
  12  |       request.post('/api/auth/signin', {
  13  |         data: { email: 'test@example.com', password: 'wrong' }
  14  |       })
  15  |     );
  16  | 
  17  |     const responses = await Promise.all(requests);
  18  |     const rateLimited = responses.some(r => r.status() === 429);
> 19  |     expect(rateLimited).toBe(true);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  20  |   });
  21  | });
  22  | 
  23  | test.describe('API Authentication', () => {
  24  |   test('protected endpoints require auth', async ({ request }) => {
  25  |     const endpoints = [
  26  |       '/api/projects',
  27  |       '/api/blocks',
  28  |       '/api/fabrics',
  29  |       '/api/community/posts'
  30  |     ];
  31  | 
  32  |     for (const endpoint of endpoints) {
  33  |       const response = await request.get(endpoint);
  34  |       expect(response.status()).toBe(401);
  35  |     }
  36  |   });
  37  | 
  38  |   test('admin endpoints require admin role', async ({ request }) => {
  39  |     const endpoints = [
  40  |       '/api/admin/posts',
  41  |       '/api/blog'
  42  |     ];
  43  | 
  44  |     for (const endpoint of endpoints) {
  45  |       const response = await request.get(endpoint);
  46  |       expect(response.status()).toBe(401);
  47  |     }
  48  |   });
  49  | });
  50  | 
  51  | test.describe('API Error Handling', () => {
  52  |   test('invalid JSON returns 400', async ({ request }) => {
  53  |     const response = await request.post('/api/projects', {
  54  |       data: 'invalid json',
  55  |       headers: { 'Content-Type': 'application/json' }
  56  |     });
  57  |     expect(response.status()).toBe(400);
  58  |   });
  59  | 
  60  |   test('missing required fields returns 400', async ({ request }) => {
  61  |     const response = await request.post('/api/projects', {
  62  |       data: {}
  63  |     });
  64  |     expect(response.status()).toBe(400);
  65  |   });
  66  | 
  67  |   test('not found returns 404', async ({ request }) => {
  68  |     const response = await request.get('/api/projects/nonexistent-id');
  69  |     expect(response.status()).toBe(404);
  70  |   });
  71  | });
  72  | 
  73  | test.describe('API CORS', () => {
  74  |   test('CORS headers are present', async ({ request }) => {
  75  |     const response = await request.get('/api/blog');
  76  |     expect(response.headers()['access-control-allow-origin']).toBeTruthy();
  77  |   });
  78  | });
  79  | 
  80  | test.describe('API Content Security', () => {
  81  |   test('SVG sanitization on upload', async ({ request }) => {
  82  |     const maliciousSVG = '<svg><script>alert("xss")</script></svg>';
  83  |     const response = await request.post('/api/blocks', {
  84  |       data: { svg: maliciousSVG }
  85  |     });
  86  |     // Should either reject or sanitize
  87  |     expect([400, 401]).toContain(response.status());
  88  |   });
  89  | });
  90  | 
  91  | test.describe('Webhook Endpoints', () => {
  92  |   test('Stripe webhook requires signature', async ({ request }) => {
  93  |     const response = await request.post('/api/webhooks/stripe', {
  94  |       data: { type: 'test' }
  95  |     });
  96  |     expect(response.status()).toBe(400);
  97  |   });
  98  | 
  99  |   test('webhook validates signature', async ({ request }) => {
  100 |     const response = await request.post('/api/webhooks/stripe', {
  101 |       data: { type: 'test' },
  102 |       headers: { 'stripe-signature': 'invalid' }
  103 |     });
  104 |     expect(response.status()).toBe(400);
  105 |   });
  106 | });
  107 | 
  108 | test.describe('API Response Format', () => {
  109 |   test('blog API returns JSON', async ({ request }) => {
  110 |     const response = await request.get('/api/blog');
  111 |     expect(response.headers()['content-type']).toContain('application/json');
  112 |   });
  113 | 
  114 |   test('error responses have consistent format', async ({ request }) => {
  115 |     const response = await request.get('/api/projects/invalid');
  116 |     const body = await response.json();
  117 |     expect(body).toHaveProperty('error');
  118 |   });
  119 | });
```