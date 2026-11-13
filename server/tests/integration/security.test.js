import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Security & Validation Integration Tests', () => {
  it('should include Helmet security headers in responses', async () => {
    const res = await request(app).get('/');
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
  });

  it('should reject invalid payload with 422 Unprocessable Entity during registration', async () => {
    const invalidPayload = {
      name: '',
      email: 'not-an-email',
      password: '123', // less than 6 chars
    };

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(invalidPayload);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject unauthorized access to protected admin route with 401', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Authentication token required');
  });

  it('should reject unauthorized access to protected vendor route with 401', async () => {
    const res = await request(app).get('/api/v1/vendor/store');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
