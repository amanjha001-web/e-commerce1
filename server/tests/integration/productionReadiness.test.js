import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/token.utils.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../../src/integrations/razorpay/razorpay.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';
import { env } from '../../src/config/env.js';
import crypto from 'crypto';

describe('ShopSphere Comprehensive Production Readiness Suite', () => {
  describe('1. Authentication, Validation & Password Match', () => {
    it('should reject registration if confirmPassword does not match password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test.mismatch@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject registration if fullName and name are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test.noname@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with missing password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request to /auth/me', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication token required');
    });

    it('should reject invalid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.structure');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Role-Based Access Control (RBAC) & Route Guards', () => {
    const customerToken = generateAccessToken({ id: '507f1f77bcf86cd799439011', role: ROLES.USER });
    const vendorToken = generateAccessToken({ id: '507f1f77bcf86cd799439022', role: ROLES.VENDOR });

    it('should forbid Customer from accessing Admin endpoints with 403', async () => {
      vi.spyOn(User, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          name: 'Customer',
          email: 'customer@example.com',
          role: ROLES.USER,
          isActive: true,
        }),
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should forbid Vendor from accessing Admin endpoints with 403', async () => {
      vi.spyOn(User, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439022',
          name: 'Vendor',
          email: 'vendor@example.com',
          role: ROLES.VENDOR,
          isActive: true,
        }),
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should forbid Customer from accessing Vendor store management with 403', async () => {
      vi.spyOn(User, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          name: 'Customer',
          email: 'customer@example.com',
          role: ROLES.USER,
          isActive: true,
        }),
      });

      const res = await request(app)
        .get('/api/v1/vendor/store')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });
  });

  describe('3. Token Generation, Expiration & Refresh Rotation', () => {
    it('should generate valid access token that decodes correctly', () => {
      const payload = { id: 'user_test_123', role: ROLES.USER };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('should generate and verify refresh tokens', () => {
      const payload = { id: 'user_test_123', role: ROLES.USER };
      const refreshToken = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(refreshToken);

      expect(decoded.id).toBe(payload.id);
    });

    it('should reject refresh request when no token provided', async () => {
      const res = await request(app).post('/api/v1/auth/refresh-token').send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Refresh token is required');
    });

    it('should reject refresh request with malformed token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'malformed_token_xyz' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired refresh token');
    });
  });

  describe('4. Payment Verification & Razorpay Webhook Signatures', () => {
    it('should accurately verify valid Razorpay payment signature', () => {
      const orderId = 'order_DA1234567890';
      const paymentId = 'pay_DA0987654321';
      const secret = env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret';

      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Temporarily set key secret if not in env
      const origSecret = env.RAZORPAY_KEY_SECRET;
      env.RAZORPAY_KEY_SECRET = secret;

      const isValid = verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

      expect(isValid).toBe(true);

      // Restore secret
      env.RAZORPAY_KEY_SECRET = origSecret;
    });

    it('should reject invalid or tampered payment signature', () => {
      const origSecret = env.RAZORPAY_KEY_SECRET;
      env.RAZORPAY_KEY_SECRET = 'test_secret';

      const isInvalid = verifyPaymentSignature({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_456',
        razorpaySignature: 'tampered_signature_hex_value_123456',
      });

      expect(isInvalid).toBe(false);
      env.RAZORPAY_KEY_SECRET = origSecret;
    });

    it('should reject payment verification without required fields', () => {
      expect(verifyPaymentSignature({})).toBe(false);
      expect(verifyPaymentSignature({ razorpayOrderId: 'ord' })).toBe(false);
    });

    it('should verify Razorpay webhook signature and reject tampered payload', () => {
      const webhookSecret = 'whsec_test_secret_123456';
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_123', order_id: 'ord_123' } } },
      });

      const validSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      expect(verifyWebhookSignature(payload, validSig, webhookSecret)).toBe(true);
      expect(verifyWebhookSignature(payload, 'tampered_sig', webhookSecret)).toBe(false);
    });
  });

  describe('5. Public Storefront, Health & API Gateway', () => {
    it('GET / should return gateway welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('ShopSphere API Gateway');
    });

    it('GET /api/v1/health should report health status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
    });

    it('GET /unknown-random-route should return standard 404', async () => {
      const res = await request(app).get('/api/v1/non-existent-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
