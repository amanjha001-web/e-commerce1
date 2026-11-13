import { Order } from '../../models/Order.model.js';
import { Cart } from '../../models/Cart.model.js';
import { Product } from '../../models/Product.model.js';
import { Address } from '../../models/Address.model.js';
import { CouponUsage } from '../../models/CouponUsage.model.js';
import { Coupon } from '../../models/Coupon.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ReturnRequest } from '../../models/ReturnRequest.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { PAYMENT_STATUS, PAYMENT_METHODS } from '../../constants/paymentStatus.constant.js';
import { roundToTwoDecimals, parsePagination } from '../../utils/helpers.js';
import { sendOrderConfirmationEmail } from '../../integrations/email/email.client.js';

export class CustomerOrderService {
  async createOrder(userId, orderPayload, user) {
    const cart = await Cart.findOne({ userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Cannot place an order with an empty cart');
    }

    // Determine Shipping Address
    let shippingAddress = orderPayload.shippingAddress;
    if (!shippingAddress && orderPayload.addressId) {
      const addr = await Address.findOne({ _id: orderPayload.addressId, userId });
      if (addr) {
        shippingAddress = {
          fullName: addr.fullName,
          phone: addr.phone,
          street: addr.street,
          apartment: addr.apartment,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
        };
      }
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      throw ApiError.badRequest('A valid shipping address is required');
    }

    // Server-side authoritative validation and calculation
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || !product.isActive) {
        throw ApiError.badRequest(`Product '${product?.name || 'Item'}' is currently unavailable`);
      }

      if (product.stock < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for '${product.name}'. Requested: ${item.quantity}, Available: ${product.stock}`
        );
      }

      const itemTotal = roundToTwoDecimals(product.price * item.quantity);
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        variant: item.variant || null,
        vendorId: product.vendorId,
        name: product.name,
        image: product.images?.[0]?.url || '',
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    const discountAmount = cart.discountAmount || 0;
    const shippingPrice = subtotal > 1000 ? 0 : 50; // free shipping over ₹1000
    const taxPrice = roundToTwoDecimals((subtotal - discountAmount) * 0.18); // 18% standard GST
    const totalAmount = roundToTwoDecimals(subtotal - discountAmount + shippingPrice + taxPrice);

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await Order.create({
      orderNumber,
      userId,
      items: orderItems,
      shippingAddress,
      paymentMethod: orderPayload.paymentMethod || PAYMENT_METHODS.RAZORPAY,
      paymentStatus:
        orderPayload.paymentMethod === PAYMENT_METHODS.COD
          ? PAYMENT_STATUS.PENDING
          : PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PENDING,
      subtotal: roundToTwoDecimals(subtotal),
      discountAmount,
      shippingPrice,
      taxPrice,
      totalAmount,
      coupon: cart.coupon ? { code: cart.coupon.code, discount: discountAmount } : undefined,
      statusHistory: [
        {
          status: ORDER_STATUS.PENDING,
          note: 'Order placed by customer',
          updatedBy: userId,
          timestamp: new Date(),
        },
      ],
    });

    // Atomically decrement stock & record inventory movements
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      await Inventory.findOneAndUpdate(
        { productId: item.product },
        { $inc: { quantity: -item.quantity } }
      );
      await StockMovement.create({
        productId: item.product,
        variantId: item.variant,
        vendorId: item.vendorId,
        type: 'OUT',
        quantity: item.quantity,
        previousStock: 0,
        newStock: 0,
        reason: `Order Placed #${orderNumber}`,
        referenceId: order._id.toString(),
        performedBy: userId,
      });
    }

    // Record coupon usage
    if (cart.coupon && cart.coupon.code) {
      const couponDoc = await Coupon.findOne({ code: cart.coupon.code });
      if (couponDoc) {
        await CouponUsage.create({
          couponId: couponDoc._id,
          userId,
          orderId: order._id,
          discountAmount,
        });
        await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usageCount: 1 } });
      }
    }

    // Empty user cart
    cart.items = [];
    cart.coupon = undefined;
    cart.totalAmount = 0;
    cart.discountAmount = 0;
    cart.finalAmount = 0;
    await cart.save();

    // Trigger async email notification
    sendOrderConfirmationEmail(user.email, user.name, order.orderNumber, order.totalAmount).catch(
      () => {}
    );

    return order;
  }

  async getMyOrders(userId, params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = { userId };

    if (params.status) filter.orderStatus = params.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name slug images price')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.product', 'name slug images price')
      .populate('items.vendorId', 'storeName slug email phone');

    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  async cancelOrder(orderId, userId, reason = '') {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw ApiError.notFound('Order not found');

    if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED].includes(order.orderStatus)) {
      throw ApiError.badRequest(`Cannot cancel an order with status '${order.orderStatus}'`);
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.cancellation = {
      reason,
      cancelledAt: new Date(),
      cancelledBy: userId,
    };
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      note: `Cancelled by customer: ${reason}`,
      updatedBy: userId,
      timestamp: new Date(),
    });
    await order.save();

    // Restock items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      await Inventory.findOneAndUpdate(
        { productId: item.product },
        { $inc: { quantity: item.quantity } }
      );
      await StockMovement.create({
        productId: item.product,
        variantId: item.variant,
        vendorId: item.vendorId,
        type: 'CANCELLED_ORDER',
        quantity: item.quantity,
        previousStock: 0,
        newStock: 0,
        reason: `Restocked after order cancellation #${order.orderNumber}`,
        referenceId: order._id.toString(),
        performedBy: userId,
      });
    }

    return order;
  }

  async returnOrder(orderId, userId, { reason = '' }) {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw ApiError.notFound('Order not found');

    if (order.orderStatus !== ORDER_STATUS.DELIVERED) {
      throw ApiError.badRequest('Returns can only be requested for delivered orders');
    }

    order.orderStatus = ORDER_STATUS.RETURN_REQUESTED;
    order.returnRequest = {
      reason,
      status: 'requested',
      requestedAt: new Date(),
    };
    order.statusHistory.push({
      status: ORDER_STATUS.RETURN_REQUESTED,
      note: `Return requested by customer: ${reason}`,
      updatedBy: userId,
      timestamp: new Date(),
    });
    await order.save();

    await ReturnRequest.create({
      orderId: order._id,
      userId,
      reason,
      status: 'pending',
    });

    return order;
  }

  async trackOrder(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw ApiError.notFound('Order not found');

    return {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      tracking: order.tracking,
      statusHistory: order.statusHistory,
      estimatedDeliveryDate: order.tracking?.estimatedDeliveryDate,
    };
  }
}

export const customerOrderService = new CustomerOrderService();
export default customerOrderService;
