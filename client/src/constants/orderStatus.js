export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  PACKED: "packed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",

  CANCELLED: "cancelled",
  RETURN_REQUESTED: "return_requested",
  RETURN_APPROVED: "return_approved",
  RETURN_REJECTED: "return_rejected",
  RETURNED: "returned",

  REFUND_PENDING: "refund_pending",
  REFUNDED: "refunded",
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: "Pending",
  [ORDER_STATUS.CONFIRMED]: "Confirmed",
  [ORDER_STATUS.PROCESSING]: "Processing",
  [ORDER_STATUS.PACKED]: "Packed",
  [ORDER_STATUS.SHIPPED]: "Shipped",
  [ORDER_STATUS.OUT_FOR_DELIVERY]: "Out for Delivery",
  [ORDER_STATUS.DELIVERED]: "Delivered",

  [ORDER_STATUS.CANCELLED]: "Cancelled",
  [ORDER_STATUS.RETURN_REQUESTED]: "Return Requested",
  [ORDER_STATUS.RETURN_APPROVED]: "Return Approved",
  [ORDER_STATUS.RETURN_REJECTED]: "Return Rejected",
  [ORDER_STATUS.RETURNED]: "Returned",

  [ORDER_STATUS.REFUND_PENDING]: "Refund Pending",
  [ORDER_STATUS.REFUNDED]: "Refunded",
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

export const ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.OUT_FOR_DELIVERY,
];

export const COMPLETED_ORDER_STATUSES = [
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.REFUNDED,
];

export const CANCELLED_ORDER_STATUSES = [
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.RETURN_REJECTED,
];

export const isValidOrderStatus = (status) => {
  return ORDER_STATUS_LIST.includes(status);
};

export default ORDER_STATUS;
