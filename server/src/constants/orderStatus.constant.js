export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURN_REQUESTED: 'return_requested',
  RETURN_APPROVED: 'return_approved',
  RETURN_REJECTED: 'return_rejected',
  RETURNED: 'returned',
  REFUND_PENDING: 'refund_pending',
  REFUNDED: 'refunded',
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

export default ORDER_STATUS;
