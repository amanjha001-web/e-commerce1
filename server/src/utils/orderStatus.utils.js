import { ORDER_STATUS, ORDER_STATUS_LIST } from '../constants/orderStatus.constant.js';
import { ApiError } from './apiError.js';
import { settleCodOrderOnDelivery } from './orderPayment.utils.js';

/**
 * Convert UI or webhook status strings (e.g. "Shipped", "Out For Delivery")
 * into canonical lowercase underscore enum values and validate them.
 */
export const normalizeOrderStatus = (status) => {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (!normalized || !ORDER_STATUS_LIST.includes(normalized)) {
    throw ApiError.badRequest(`Invalid order status: ${status}`);
  }

  return normalized;
};

/**
 * Convert an internal enum status like "out_for_delivery" into "Out For Delivery".
 */
export const formatOrderStatusLabel = (status) =>
  String(status || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

/**
 * Append a chronological entry to an order's statusHistory array.
 */
export const appendOrderStatusHistory = (order, { status, note = '', updatedBy } = {}) => {
  if (!order) return;
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }

  const entry = {
    status,
    note: note || `Status updated to ${formatOrderStatusLabel(status)}`,
    timestamp: new Date(),
  };

  if (updatedBy) {
    entry.updatedBy = updatedBy;
  }

  order.statusHistory.push(entry);
};

/**
 * Apply a validated order status change, append to statusHistory,
 * and synchronize delivery/COD settlement or terminal metadata.
 */
export const applyOrderStatusTransition = async (
  order,
  { status, note = '', updatedBy, actorLabel = 'system' } = {}
) => {
  const normalizedStatus = normalizeOrderStatus(status);
  const label = formatOrderStatusLabel(normalizedStatus);

  order.orderStatus = normalizedStatus;
  appendOrderStatusHistory(order, {
    status: normalizedStatus,
    note: note || `Updated by ${actorLabel} to ${label}`,
    updatedBy,
  });

  if (normalizedStatus === ORDER_STATUS.DELIVERED) {
    order.isDelivered = true;
    order.deliveredAt = order.deliveredAt || new Date();
    await settleCodOrderOnDelivery(order);
  } else if (normalizedStatus === ORDER_STATUS.CANCELLED) {
    order.cancellation = {
      reason: note || order.cancellation?.reason || `Cancelled by ${actorLabel}`,
      cancelledAt: order.cancellation?.cancelledAt || new Date(),
      ...(updatedBy
        ? { cancelledBy: updatedBy }
        : order.cancellation?.cancelledBy
          ? { cancelledBy: order.cancellation.cancelledBy }
          : {}),
    };
  } else if (
    normalizedStatus === ORDER_STATUS.RETURN_APPROVED &&
    order.returnRequest
  ) {
    order.returnRequest.status = 'approved';
    order.returnRequest.actionedAt = order.returnRequest.actionedAt || new Date();
    if (updatedBy) order.returnRequest.actionedBy = updatedBy;
  } else if (
    normalizedStatus === ORDER_STATUS.RETURN_REJECTED &&
    order.returnRequest
  ) {
    order.returnRequest.status = 'rejected';
    order.returnRequest.actionedAt = order.returnRequest.actionedAt || new Date();
    if (note && !order.returnRequest.rejectionReason) {
      order.returnRequest.rejectionReason = note;
    }
    if (updatedBy) order.returnRequest.actionedBy = updatedBy;
  }

  return normalizedStatus;
};

export default {
  normalizeOrderStatus,
  formatOrderStatusLabel,
  appendOrderStatusHistory,
  applyOrderStatusTransition,
};
