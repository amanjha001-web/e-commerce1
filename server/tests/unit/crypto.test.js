import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateOtp,
  generateRandomToken,
  hashToken,
  verifyHmacSignature,
} from '../../src/utils/crypto.utils.js';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../src/utils/token.utils.js';
import { verifyWebhookSignature } from '../../src/integrations/razorpay/razorpay.utils.js';
import crypto from 'crypto';

describe('Crypto & Token Utilities Unit Tests', () => {
  it('should hash and verify passwords correctly', async () => {
    const raw = 'SecurePassword123!';
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    expect(hashed).toMatch(/^\$2[aby]\$/);

    const isMatch = await comparePassword(raw, hashed);
    expect(isMatch).toBe(true);

    const isBadMatch = await comparePassword('WrongPassword', hashed);
    expect(isBadMatch).toBe(false);
  });

  it('should generate valid 6-digit OTPs', () => {
    const otp = generateOtp(6);
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should generate and verify JWT access and refresh tokens', () => {
    const payload = { id: '507f1f77bcf86cd799439011', role: 'user' };
    const accessToken = generateAccessToken(payload);
    const decoded = verifyAccessToken(accessToken);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.role).toBe(payload.role);

    const refreshToken = generateRefreshToken(payload);
    const decodedRefresh = verifyRefreshToken(refreshToken);
    expect(decodedRefresh.id).toBe(payload.id);
  });

  it('should verify HMAC webhook signatures accurately', () => {
    const secret = 'test_webhook_secret_key_123';
    const payload = JSON.stringify({ event: 'payment.captured', id: 'pay_123' });
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const isValid = verifyWebhookSignature(payload, signature, secret);
    expect(isValid).toBe(true);

    const isInvalid = verifyWebhookSignature(payload, 'tampered_signature', secret);
    expect(isInvalid).toBe(false);
  });
});
