import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Application Core Integration Tests', () => {
  it('GET / should return 200 with API Gateway info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('ShopSphere');
  });

  it('GET /api/v1/health should return 200 with health details', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('uptime');
  });

  it('GET /unknown-random-route-path should return standard 404 response', async () => {
    const res = await request(app).get('/unknown-random-route-path');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.message).toContain('Route not found');
  });
});
