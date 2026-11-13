import { Order } from '../../models/Order.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { notificationService } from '../common/notification.service.js';

export class VendorOrderService {
  async getVendorId(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor._id;
  }

  async getVendorOrders(userId, params = {}) {
    const vendorId = await this.getVendorId(userId);
    const { page, limit, skip, sort } = parsePagination(params);

    const filter = { 'items.vendorId': vendorId };
    if (params.status) filter.orderStatus = params.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email phone')
        .populate('items.product', 'name slug images')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    // Filter items in order to only those belonging to this vendor
    const filteredOrders = orders.map((order) => {
      const doc = order.toObject();
      doc.items = doc.items.filter((i) => i.vendorId.toString() === vendorId.toString());
      return doc;
    });

    return {
      orders: filteredOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorOrderById(userId, orderId) {
    const vendorId = await this.getVendorId(userId);
    const order = await Order.findOne({ _id: orderId, 'items.vendorId': vendorId })
      .populate('userId', 'name email phone')
      .populate('items.product', 'name slug images');

    if (!order) throw ApiError.notFound('Order not found or no items for this vendor');

    const doc = order.toObject();
    doc.items = doc.items.filter((i) => i.vendorId.toString() === vendorId.toString());
    return doc;
  }

  async updateOrderStatus(userId, orderId, { status, note = '' }) {
    const vendorId = await this.getVendorId(userId);
    const order = await Order.findOne({ _id: orderId, 'items.vendorId': vendorId });
    if (!order) throw ApiError.notFound('Order not found');

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      note: note || `Updated by vendor to ${status}`,
      updatedBy: userId,
      timestamp: new Date(),
    });

    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    await order.save();

    // Notify customer
    notificationService
      .createNotification({
        userId: order.userId,
        title: 'Order Status Update',
        message: `Your order #${order.orderNumber} is now ${status}.`,
        type: 'order',
        data: { orderId: order._id, status },
      })
      .catch(() => {});

    return order;
  }
}

export const vendorOrderService = new VendorOrderService();
export default vendorOrderService;
