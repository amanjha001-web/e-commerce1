export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUND_PENDING: 'refund_pending',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUS);

export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  COD: 'cod',
  WALLET: 'wallet',
  STRIPE: 'stripe',
};

export const PAYMENT_METHOD_LIST = Object.values(PAYMENT_METHODS);

export default PAYMENT_STATUS;
