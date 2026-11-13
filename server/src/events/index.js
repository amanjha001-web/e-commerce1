import { EventEmitter } from 'events';
import logger from '../config/logger.js';
import { notificationService } from '../services/common/notification.service.js';
import { sendOrderConfirmationEmail } from '../integrations/email/email.client.js';

class DomainEventEmitter extends EventEmitter {}

export const domainEvents = new DomainEventEmitter();

export const DOMAIN_EVENTS = {
  USER_REGISTERED: 'user:registered',
  ORDER_CREATED: 'order:created',
  PAYMENT_COMPLETED: 'payment:completed',
  PAYMENT_FAILED: 'payment:failed',
  NOTIFICATION_CREATED: 'notification:created',
  VENDOR_REQUEST_APPROVED: 'vendor_request:approved',
};

// Domain event listeners
domainEvents.on(DOMAIN_EVENTS.USER_REGISTERED, async ({ user }) => {
  logger.info(`[EVENT] User registered: ${user.email} (${user._id})`);
});

domainEvents.on(DOMAIN_EVENTS.ORDER_CREATED, async ({ order, user }) => {
  logger.info(`[EVENT] Order placed: #${order.orderNumber} for user ${order.userId}`);
  if (user && user.email) {
    sendOrderConfirmationEmail(user.email, user.name, order.orderNumber, order.totalAmount).catch(
      () => {}
    );
  }
});

domainEvents.on(DOMAIN_EVENTS.PAYMENT_COMPLETED, async ({ payment, order }) => {
  logger.info(`[EVENT] Payment completed: ${payment._id} for order ${order?.orderNumber}`);
});

domainEvents.on(DOMAIN_EVENTS.PAYMENT_FAILED, async ({ payment, order, reason }) => {
  logger.warn(`[EVENT] Payment failed for order ${order?.orderNumber}: ${reason}`);
  if (order) {
    notificationService
      .createNotification({
        userId: order.userId,
        title: 'Payment Failed',
        message: `Your payment for order #${order.orderNumber} failed: ${reason || 'Transaction could not be processed'}.`,
        type: 'payment',
        data: { orderId: order._id },
      })
      .catch(() => {});
  }
});

export default domainEvents;
