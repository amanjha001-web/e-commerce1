import { Payment } from '../../models/Payment.model.js';
import { VendorPayout } from '../../models/VendorPayout.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { fetchRazorpayPayment } from '../../integrations/razorpay/razorpay.client.js';

export class AdminPaymentService {
  async getPayments(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.status) filter.status = params.status;
    if (params.paymentMethod) filter.paymentMethod = params.paymentMethod;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('userId', 'name email phone')
        .populate('orderId', 'orderNumber totalAmount')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentById(paymentId) {
    const payment = await Payment.findById(paymentId)
      .populate('userId', 'name email phone')
      .populate('orderId');

    if (!payment) throw ApiError.notFound('Payment record not found');
    return payment;
  }

  async reconcilePayment(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw ApiError.notFound('Payment not found');

    if (!payment.razorpayPaymentId) {
      return { status: payment.status, reconciled: false, reason: 'No Razorpay ID' };
    }

    const gatewayPayment = await fetchRazorpayPayment(payment.razorpayPaymentId);
    const gatewayStatus = gatewayPayment.status === 'captured' ? 'success' : gatewayPayment.status;

    const statusChanged = payment.status !== gatewayStatus;
    if (statusChanged) {
      payment.status = gatewayStatus;
      await payment.save();
    }

    return {
      paymentId: payment._id,
      localStatus: payment.status,
      gatewayStatus: gatewayPayment.status,
      reconciled: true,
      updated: statusChanged,
    };
  }

  async getVendorPayouts(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.status) filter.status = params.status.toUpperCase();
    if (params.vendorId) filter.vendorId = params.vendorId;

    const [payouts, total] = await Promise.all([
      VendorPayout.find(filter)
        .populate('vendorId', 'storeName slug email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      VendorPayout.countDocuments(filter),
    ]);

    return {
      payouts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorPayoutById(payoutId) {
    const payout = await VendorPayout.findById(payoutId).populate('vendorId', 'storeName slug email phone');
    if (!payout) throw ApiError.notFound('Payout record not found');
    return payout;
  }

  async updateVendorPayoutStatus(payoutId, status, adminId) {
    const payout = await VendorPayout.findById(payoutId);
    if (!payout) throw ApiError.notFound('Payout record not found');

    const formattedStatus = status.toUpperCase();
    payout.status = formattedStatus;
    payout.processedBy = adminId;
    payout.processedAt = new Date();
    await payout.save();

    const earnings = await VendorEarnings.findOne({ vendorId: payout.vendorId });
    if (earnings) {
      if (formattedStatus === 'PAID') {
        earnings.pendingBalance = Math.max(0, earnings.pendingBalance - payout.amount);
        earnings.totalWithdrawn += payout.amount;
      } else if (['REJECTED', 'CANCELLED'].includes(formattedStatus)) {
        earnings.pendingBalance = Math.max(0, earnings.pendingBalance - payout.amount);
        earnings.availableBalance += payout.amount;
      }
      await earnings.save();
    }

    return payout;
  }
}

export const adminPaymentService = new AdminPaymentService();
export default adminPaymentService;
