import { BaseRepository } from './base.repository.js';
import { Payment } from '../models/Payment.model.js';

export class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findByOrderId(orderId) {
    return this.model.findOne({ orderId }).populate('orderId');
  }

  async findByRazorpayOrderId(razorpayOrderId) {
    return this.model.findOne({ razorpayOrderId }).populate('orderId');
  }

  async findByRazorpayPaymentId(razorpayPaymentId) {
    return this.model.findOne({ razorpayPaymentId }).populate('orderId');
  }
}

export const paymentRepository = new PaymentRepository();
export default paymentRepository;
