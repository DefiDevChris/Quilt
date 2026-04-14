# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> API Pagination >> blog API supports pagination
- Location: tests/e2e/api.spec.ts:122:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
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
  120 | 
  121 | test.describe('API Pagination', () => {
  122 |   test('blog API supports pagination', async ({ request }) => {
  123 |     const response = await request.get('/api/blog?limit=5&offset=0');
  124 |     expect(response.status()).toBe(200);
  125 |     const body = await response.json();
> 126 |     expect(Array.isArray(body)).toBe(true);
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  127 |   });
  128 | 
  129 |   test('community posts API supports pagination', async ({ request }) => {
  130 |     const response = await request.get('/api/community/posts?limit=10&offset=0');
  131 |     // Will be 401 without auth, but endpoint exists
  132 |     expect([200, 401]).toContain(response.status());
  133 |   });
  134 | });
  135 | 
  136 | test.describe('API Search', () => {
  137 |   test('projects search endpoint exists', async ({ request }) => {
  138 |     const response = await request.get('/api/projects?search=test');
  139 |     expect([200, 401]).toContain(response.status());
  140 |   });
  141 | 
  142 |   test('blocks search endpoint exists', async ({ request }) => {
  143 |     const response = await request.get('/api/blocks?search=nine');
  144 |     expect([200, 401]).toContain(response.status());
  145 |   });
  146 | });
  147 | 
  148 | test.describe('API File Upload', () => {
  149 |   test('file upload has size limits', async ({ request }) => {
  150 |     // Create a large buffer (> 10MB)
  151 |     const largeFile = Buffer.alloc(11 * 1024 * 1024);
  152 |     const response = await request.post('/api/upload', {
  153 |       multipart: {
  154 |         file: {
  155 |           name: 'large.png',
  156 |           mimeType: 'image/png',
  157 |           buffer: largeFile
  158 |         }
  159 |       }
  160 |     });
  161 |     expect([400, 413]).toContain(response.status());
  162 |   });
  163 | 
  164 |   test('file upload validates mime types', async ({ request }) => {
  165 |     const response = await request.post('/api/upload', {
  166 |       multipart: {
  167 |         file: {
  168 |           name: 'test.exe',
  169 |           mimeType: 'application/x-msdownload',
  170 |           buffer: Buffer.from('test')
  171 |         }
  172 |       }
  173 |     });
  174 |     expect([400, 401, 415]).toContain(response.status());
  175 |   });
  176 | });
  177 | 
```