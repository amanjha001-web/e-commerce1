import { Order } from '../../models/Order.model.js';
import { Cart } from '../../models/Cart.model.js';
import { Product } from '../../models/Product.model.js';
import { Address } from '../../models/Address.model.js';
import { CouponUsage } from '../../models/CouponUsage.model.js';
import { Coupon } from '../../models/Coupon.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ReturnRequest } from '../../models/ReturnRequest.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { PAYMENT_STATUS, PAYMENT_METHODS } from '../../constants/paymentStatus.constant.js';
import { roundToTwoDecimals, parsePagination } from '../../utils/helpers.js';
import { sendOrderConfirmationEmail } from '../../integrations/email/email.client.js';
import { notificationService } from '../common/notification.service.js';

export class CustomerOrderService {
  async createOrder(userId, orderPayload, user) {
    const cart = await Cart.findOne({ $or: [{ userId }, { user: userId }] }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Cannot place an order with an empty cart');
    }

    // Determine Shipping Address
    let shippingAddress = orderPayload.shippingAddress;
    const targetAddressId = orderPayload.addressId || orderPayload.shippingAddressId;
    if (!shippingAddress && targetAddressId) {
      const addr = await Address.findOne({ _id: targetAddressId, $or: [{ userId }, { user: userId }] });
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

    if (!shippingAddress || (!shippingAddress.street && !shippingAddress.addressLine1) || !shippingAddress.city) {
      throw ApiError.badRequest('A valid shipping address is required');
    }

    // Server-side authoritative validation and calculation
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const productId = item.product?._id || item.product;
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        throw ApiError.badRequest(`Product '${product?.name || 'Item'}' is currently unavailable`);
      }

      if (product.stock < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for '${product.name}'. Requested: ${item.quantity}, Available: ${product.stock}`
        );
      }

      let vendorId = product.vendorId || item.product?.vendorId || null;
      if (!vendorId) {
        const anyVendor = await Vendor.findOne();
        if (anyVendor) {
          vendorId = anyVendor._id;
          await Product.findByIdAndUpdate(product._id, { vendorId: anyVendor._id }).catch(() => {});
        }
      }

      const itemTotal = roundToTwoDecimals(product.price * item.quantity);
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        variant: item.variant || null,
        vendorId: vendorId || undefined,
        name: product.name,
        image: product.images?.[0]?.url || '',
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    const discountAmount = cart.discountAmount || 0;
    const shippingPrice = subtotal >= 999 ? 0 : 50; // free shipping on orders ₹999 and above
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

    // Notify customer & vendors
    notificationService
      .createNotification({
        userId,
        title: 'Order Placed Successfully',
        message: `Your order #${order.orderNumber} of ₹${order.totalAmount} has been placed.`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, status: order.orderStatus },
      })
      .catch(() => {});

    const uniqueVendorIds = [...new Set(orderItems.map((i) => i.vendorId).filter(Boolean).map(String))];
    if (uniqueVendorIds.length > 0) {
      Vendor.find({ _id: { $in: uniqueVendorIds } })
        .select('userId')
        .then((vendors) => {
          vendors.forEach((v) => {
            if (v?.userId) {
              notificationService
                .createNotification({
                  userId: v.userId,
                  title: 'New Order Received',
                  message: `New order #${order.orderNumber} received for your store.`,
                  type: 'order',
                  link: '/vendor/orders',
                  data: { orderId: order._id, orderNumber: order.orderNumber },
                })
                .catch(() => {});
            }
          });
        })
        .catch(() => {});
    }

    notificationService
      .notifyAdmins({
        title: 'New Order Placed',
        message: `Order #${order.orderNumber} (₹${order.totalAmount}) was placed by ${user?.name || 'a customer'}.`,
        type: 'order',
        link: '/admin/orders',
        data: { orderId: order._id, orderNumber: order.orderNumber },
      })
      .catch(() => {});

    return order;
  }

  async getMyOrders(userId, params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = { $or: [{ userId }, { user: userId }] };

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
    const order = await Order.findOne({ _id: orderId, $or: [{ userId }, { user: userId }] })
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

    notificationService
      .createNotification({
        userId,
        title: 'Order Cancelled',
        message: `Your order #${order.orderNumber} has been cancelled.`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, status: ORDER_STATUS.CANCELLED },
      })
      .catch(() => {});

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

    notificationService
      .createNotification({
        userId,
        title: 'Return Request Submitted',
        message: `Return request for order #${order.orderNumber} has been submitted for review.`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, status: ORDER_STATUS.RETURN_REQUESTED },
      })
      .catch(() => {});

    notificationService
      .notifyAdmins({
        title: 'New Return Request',
        message: `Return requested for order #${order.orderNumber}.`,
        type: 'order',
        link: '/admin/refunds',
        data: { orderId: order._id, orderNumber: order.orderNumber },
      })
      .catch(() => {});

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
