/**
 * Payment Status Constants
 *
 * Used for:
 * Razorpay / Stripe / Payment Gateway integration
 * Payment tracking
 * Refund management
 * Transaction history
 */

export const PAYMENT_STATUS = Object.freeze({
  /* Initial Payment States                                                   */

  PENDING: "pending",

  PROCESSING: "processing",

  /* Successful Payments                                                      */

  PAID: "paid",

  VERIFIED: "verified",

  /* Failed Payments                                                          */

  FAILED: "failed",

  CANCELLED: "cancelled",

  EXPIRED: "expired",

  /* Refund States                                                            */

  REFUND_REQUESTED: "refund_requested",

  REFUND_PROCESSING: "refund_processing",

  REFUNDED: "refunded",

  REFUND_FAILED: "refund_failed",

  /* Partial Payment Support                                                  */

  PARTIALLY_PAID: "partially_paid",
});
