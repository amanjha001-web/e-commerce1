/**
 * Order Status Constants
 *
 * Complete order lifecycle:
 *
 * Pending
 *  
 * Confirmed
 *  
 * Processing
 *  
 * Shipped
 *  
 * Delivered
 *
 * Exception flows:
 * Cancelled
 * Failed
 * Returned
 * Refunded
 */

export const ORDER_STATUS = Object.freeze({
  // Order placed but not processed
  PENDING: "pending",

  // Payment successful / order accepted
  CONFIRMED: "confirmed",

  // Vendor preparing the order
  PROCESSING: "processing",

  // Order handed over to delivery partner
  SHIPPED: "shipped",

  // Customer received the order
  DELIVERED: "delivered",

  /* Cancellation Flow                                                        */

  CANCELLED: "cancelled",

  CANCEL_REQUESTED: "cancel_requested",

  /* Return Flow                                                              */

  RETURN_REQUESTED: "return_requested",

  RETURN_APPROVED: "return_approved",

  RETURN_REJECTED: "return_rejected",

  RETURNED: "returned",

  /* Refund Flow                                                              */

  REFUND_PENDING: "refund_pending",

  REFUNDED: "refunded",

  /* Payment / System Failure                                                 */

  PAYMENT_FAILED: "payment_failed",

  FAILED: "failed",
});
