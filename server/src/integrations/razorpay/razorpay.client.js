import { getRazorpayInstance } from '../../config/razorpay.js';
import { env } from '../../config/env.js';
import logger from '../../config/logger.js';

export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const razorpay = getRazorpayInstance();

  // If Razorpay credentials are not set, return simulated order for dev/tests
  if (!razorpay) {
    logger.info(`[SIMULATED] Razorpay Order created: amount=${amount}, receipt=${receipt}`);
    return {
      id: `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: Math.round(amount * 100),
      currency,
      receipt,
      status: 'created',
      notes,
    };
  }

  // Amount in smallest currency unit (paise for INR)
  const options = {
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  };

  return razorpay.orders.create(options);
};

export const fetchRazorpayPayment = async (paymentId) => {
  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    return { id: paymentId, status: 'captured', amount: 10000, currency: 'INR' };
  }
  return razorpay.payments.fetch(paymentId);
};

export const createRazorpayRefund = async (paymentId, { amount, notes = {} }) => {
  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    logger.info(`[SIMULATED] Razorpay Refund: paymentId=${paymentId}, amount=${amount}`);
    return {
      id: `rfnd_sim_${Date.now()}`,
      payment_id: paymentId,
      amount: Math.round(amount * 100),
      status: 'processed',
    };
  }

  const options = {
    amount: Math.round(amount * 100),
    notes,
  };

  return razorpay.payments.refund(paymentId, options);
};

export default { createRazorpayOrder, fetchRazorpayPayment, createRazorpayRefund };
