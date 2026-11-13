import { BaseRepository } from './base.repository.js';
import { Order } from '../models/Order.model.js';

export class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async findByOrderNumber(orderNumber) {
    return this.model
      .findOne({ orderNumber })
      .populate('userId', 'name email phone')
      .populate('items.product', 'name slug images price')
      .populate('items.vendorId', 'storeName slug');
  }

  async findOrderWithDetails(orderId) {
    return this.model
      .findById(orderId)
      .populate('userId', 'name email phone')
      .populate('items.product', 'name slug images price')
      .populate('items.vendorId', 'storeName slug email phone');
  }

  async findUserOrders(userId, pagination = {}) {
    return this.paginate({ userId }, {
      ...pagination,
      populate: [
        { path: 'items.product', select: 'name slug images price' },
      ],
    });
  }

  async findVendorOrders(vendorId, pagination = {}) {
    return this.paginate({ 'items.vendorId': vendorId }, {
      ...pagination,
      populate: [
        { path: 'userId', select: 'name email phone' },
        { path: 'items.product', select: 'name slug images price' },
      ],
    });
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;
