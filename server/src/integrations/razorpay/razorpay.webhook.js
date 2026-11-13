import { Payment } from '../../models/Payment.model.js';
import { Order } from '../../models/Order.model.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.constant.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { verifyWebhookSignature } from './razorpay.utils.js';
import logger from '../../config/logger.js';

export const handleRazorpayWebhook = async (req) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Invalid Razorpay webhook signature attempt.');
    throw new Error('Invalid webhook signature');
  }

  const event = req.body.event;
  const payload = req.body.payload;

  logger.info(`Processing Razorpay Webhook Event: ${event}`);

  switch (event) {
    case 'payment.captured': {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      const payment = await Payment.findOne({ razorpayOrderId });
      if (!payment) {
        logger.warn(`No payment record found for order ${razorpayOrderId}`);
        return { status: 'skipped', reason: 'payment_not_found' };
      }

      // Idempotency: If already marked success, skip duplicate processing
      if (payment.status === PAYMENT_STATUS.SUCCESS) {
        logger.info(`Payment ${payment._id} already marked success. Skipping.`);
        return { status: 'already_processed' };
      }

      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.isVerified = true;
      await payment.save();

      // Update associated Order
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        orderStatus: ORDER_STATUS.CONFIRMED,
        isPaid: true,
        paidAt: new Date(),
        $push: {
          statusHistory: {
            status: ORDER_STATUS.CONFIRMED,
            note: 'Payment confirmed via Razorpay webhook.',
            timestamp: new Date(),
          },
        },
      });

      return { status: 'processed', event };
    }

    case 'payment.failed': {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;

      const payment = await Payment.findOne({ razorpayOrderId });
      if (payment && payment.status !== PAYMENT_STATUS.SUCCESS) {
        payment.status = PAYMENT_STATUS.FAILED;
        payment.failureReason = paymentEntity.error_description || 'Payment failed';
        await payment.save();

        await Order.findByIdAndUpdate(payment.orderId, {
          paymentStatus: PAYMENT_STATUS.FAILED,
        });
      }
      return { status: 'processed', event };
    }

    default:
      return { status: 'ignored', event };
  }
};

export default { handleRazorpayWebhook };
