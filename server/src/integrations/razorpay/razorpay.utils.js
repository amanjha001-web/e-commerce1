import crypto from 'crypto';
import { env } from '../../config/env.js';

export const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  // Allow simulated signatures in dev mode if secret not configured
  if (!env.RAZORPAY_KEY_SECRET) {
    return razorpaySignature.startsWith('sig_') || razorpaySignature === 'simulated_valid_signature';
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const bufA = Buffer.from(expectedSignature, 'utf8');
  const bufB = Buffer.from(razorpaySignature, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export const verifyWebhookSignature = (rawBody, signature, secret = env.RAZORPAY_WEBHOOK_SECRET) => {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const bufA = Buffer.from(expectedSignature, 'utf8');
  const bufB = Buffer.from(signature, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export default { verifyPaymentSignature, verifyWebhookSignature };
