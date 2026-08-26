export const PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",

  REFUND_PENDING: "refund_pending",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",

  CANCELLED: "cancelled",
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: "Pending",
  [PAYMENT_STATUS.PROCESSING]: "Processing",
  [PAYMENT_STATUS.SUCCESS]: "Success",
  [PAYMENT_STATUS.FAILED]: "Failed",

  [PAYMENT_STATUS.REFUND_PENDING]: "Refund Pending",
  [PAYMENT_STATUS.REFUNDED]: "Refunded",
  [PAYMENT_STATUS.PARTIALLY_REFUNDED]: "Partially Refunded",

  [PAYMENT_STATUS.CANCELLED]: "Cancelled",
};

export const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUS);

export const SUCCESS_PAYMENT_STATUSES = [PAYMENT_STATUS.SUCCESS];

export const FAILED_PAYMENT_STATUSES = [
  PAYMENT_STATUS.FAILED,
  PAYMENT_STATUS.CANCELLED,
];

export const REFUND_PAYMENT_STATUSES = [
  PAYMENT_STATUS.REFUND_PENDING,
  PAYMENT_STATUS.REFUNDED,
  PAYMENT_STATUS.PARTIALLY_REFUNDED,
];

export const isValidPaymentStatus = (status) => {
  return PAYMENT_STATUS_LIST.includes(status);
};

export const isPaymentSuccessful = (status) => {
  return SUCCESS_PAYMENT_STATUSES.includes(status);
};

export const isPaymentFailed = (status) => {
  return FAILED_PAYMENT_STATUSES.includes(status);
};

export default PAYMENT_STATUS;
