import mongoose from "mongoose";

import ApiError from "../utils/ApiError.js";

import orderRepository from "../repositories/order.repository.js";
import cartRepository from "../repositories/cart.repository.js";
import productRepository from "../repositories/product.repository.js";
import couponRepository from "../repositories/coupon.repository.js";
import userRepository from "../repositories/user.repository.js";

/*                             Helper Functions                               */

const getProductPrice = (product) => {
  return product.discountPrice > 0
    ? product.discountPrice
    : product.price;
};

const getDefaultAddress = (user) => {
  const address = user.addresses.find(
    (item) => item.isDefault,
  );

  if (!address) {
    throw new ApiError(
      400,
      "Default shipping address not found",
    );
  }

  return address.toObject
    ? address.toObject()
    : address;
};

const validateCoupon = async (
  couponCode,
  subtotal,
) => {
  if (!couponCode) {
    return {
      coupon: null,
      discount: 0,
    };
  }

  const coupon =
    await couponRepository.getCouponByCode(
      couponCode.toUpperCase(),
    );

  if (!coupon) {
    throw new ApiError(
      404,
      "Invalid coupon",
    );
  }

  if (!coupon.isActive) {
    throw new ApiError(
      400,
      "Coupon is inactive",
    );
  }

  const now = new Date();

  if (now < coupon.startDate) {
    throw new ApiError(
      400,
      "Coupon is not active yet",
    );
  }

  if (now > coupon.expiryDate) {
    throw new ApiError(
      400,
      "Coupon has expired",
    );
  }

  if (
    coupon.usedCount >=
    coupon.usageLimit
  ) {
    throw new ApiError(
      400,
      "Coupon usage limit exceeded",
    );
  }

  if (
    subtotal <
    coupon.minimumOrderAmount
  ) {
    throw new ApiError(
      400,
      `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
    );
  }

  let discount = 0;

  if (
    coupon.discountType ===
    "percentage"
  ) {
    discount =
      (subtotal *
        coupon.discountValue) /
      100;

    if (
      coupon.maximumDiscount > 0 &&
      discount >
        coupon.maximumDiscount
    ) {
      discount =
        coupon.maximumDiscount;
    }
  } else {
    discount =
      coupon.discountValue;
  }

  return {
    coupon,
    discount: Math.min(
      discount,
      subtotal,
    ),
  };
};

/*                              Create Order                                  */

const createOrder = async (
  userId,
  { paymentMethod = "COD", couponCode = null } = {},
) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const cart = await cartRepository.getCartByUserId(userId);

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Your cart is empty");
    }

    const user = await userRepository.getUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const shippingAddress = getDefaultAddress(user);

    const orderItems = [];

    let subtotal = 0;
    /*                     Validate Products & Build Items                    */

    for (const cartItem of cart.items) {
      const product = await productRepository.getProductById(
        cartItem.product._id || cartItem.product,
      );

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      if (!product.isActive) {
        throw new ApiError(400, `${product.name} is currently unavailable`);
      }

      if (product.stock < cartItem.quantity) {
        throw new ApiError(
          400,
          `Only ${product.stock} stock available for ${product.name}`,
        );
      }

      const price = getProductPrice(product);

      const totalPrice = price * cartItem.quantity;

      subtotal += totalPrice;

      orderItems.push({
        product: product._id,

        vendor: product.vendor._id || product.vendor,

        sku: product.sku,

        name: product.name,

        slug: product.slug,

        image: product.thumbnail?.url || "",

        quantity: cartItem.quantity,

        priceAtPurchase: price,

        totalPrice,
      });
    }

    /*                           Apply Coupon                                 */

    const { coupon, discount } = await validateCoupon(couponCode, subtotal);

    /*                       Shipping & Tax                                   */

    let shippingCharge = 0;

    if (subtotal < 999) {
      shippingCharge = 80;
    }

    const tax = Number(((subtotal - discount) * 0.18).toFixed(2));

    const totalAmount = Number(
      (subtotal + shippingCharge + tax - discount).toFixed(2),
    );
    /*                           Create Order                                 */

    const order = await orderRepository.createOrder(
      {
        user: userId,

        items: orderItems,

        shippingAddress,

        subtotal,

        discount,

        shippingCharge,

        tax,

        totalAmount,

        paymentMethod,

        coupon: coupon ? coupon._id : null,
      },
      session,
    );

    /*                        Update Product Stock                            */

    for (const item of orderItems) {
      const product = await productRepository.getProductById(item.product);

      await productRepository.updateProductStock(
        product._id,
        product.stock - item.quantity,
        product.sold + item.quantity,
        session,
      );
    }

    /*                         Update Coupon Usage                            */

    if (coupon) {
      await couponRepository.updateCoupon(
        coupon._id,
        {
          $inc: {
            usedCount: 1,
          },
        },
        session,
      );
    }

    /*                            Clear Cart                                  */

    await cartRepository.updateCart(
      userId,
      {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      },
      session,
    );

    /*                         Commit Transaction                             */

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error;
  }
};
/*                             Get My Orders                                  */

const getMyOrders = async (
  userId,
  query = {},
) => {
  const {
    page = 1,
    limit = 10,
    orderStatus,
    paymentStatus,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {
    user: userId,
  };

  if (orderStatus) {
    filter.orderStatus =
      orderStatus;
  }

  if (paymentStatus) {
    filter.paymentStatus =
      paymentStatus;
  }

  const sort = {
    [sortBy]:
      order === "asc" ? 1 : -1,
  };

  return await orderRepository.getOrdersByUser(
    filter,
    {
      page: Number(page),
      limit: Number(limit),
      sort,
    },
  );
};

/*                           Get Order By Id                                  */

const getOrderById = async (
  orderId,
  user,
) => {
  const order =
    await orderRepository.getOrderById(
      orderId,
    );

  if (!order) {
    throw new ApiError(
      404,
      "Order not found",
    );
  }

  if (
    user.role !== "admin" &&
    order.user._id.toString() !==
      user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to access this order",
    );
  }

  return order;
};

/*                           Get All Orders                                   */

const getAllOrders = async (
  query = {},
) => {
  const {
    page = 1,
    limit = 10,
    keyword = "",
    orderStatus,
    paymentStatus,
    paymentMethod,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {};

  if (keyword) {
    filter.orderNumber = {
      $regex: keyword,
      $options: "i",
    };
  }

  if (orderStatus) {
    filter.orderStatus =
      orderStatus;
  }

  if (paymentStatus) {
    filter.paymentStatus =
      paymentStatus;
  }

  if (paymentMethod) {
    filter.paymentMethod =
      paymentMethod;
  }

  const sort = {
    [sortBy]:
      order === "asc" ? 1 : -1,
  };

  return await orderRepository.getAllOrders(
    filter,
    {
      page: Number(page),
      limit: Number(limit),
      sort,
    },
  );
};
/*                             Cancel Order                                   */

const cancelOrder = async (
  orderId,
  user,
) => {
  const session =
    await mongoose.startSession();

  session.startTransaction();

  try {
    const order =
      await orderRepository.getOrderById(
        orderId,
      );

    if (!order) {
      throw new ApiError(
        404,
        "Order not found",
      );
    }

    if (
      user.role !== "admin" &&
      order.user._id.toString() !==
        user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You are not authorized to cancel this order",
      );
    }

    if (
      [
        "Delivered",
        "Cancelled",
      ].includes(order.orderStatus)
    ) {
      throw new ApiError(
        400,
        `Order cannot be cancelled after ${order.orderStatus}`,
      );
    }

    for (const item of order.items) {
      const product =
        await productRepository.getProductById(
          item.product,
        );

      if (product) {
        await productRepository.updateProductStock(
          product._id,
          product.stock +
            item.quantity,
          Math.max(
            0,
            product.sold -
              item.quantity,
          ),
          session,
        );
      }
    }

    const updatedOrder =
      await orderRepository.updateOrder(
        orderId,
        {
          orderStatus:
            "Cancelled",
          cancelledAt:
            new Date(),
        },
        session,
      );

    await session.commitTransaction();
    session.endSession();

    return updatedOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error;
  }
};

/*                         Update Order Status                                */

const updateOrderStatus =
  async (
    orderId,
    status,
  ) => {
    const order =
      await orderRepository.getOrderById(
        orderId,
      );

    if (!order) {
      throw new ApiError(
        404,
        "Order not found",
      );
    }

    const updateData = {
      orderStatus: status,
    };

    if (
      status === "Delivered"
    ) {
      updateData.deliveredAt =
        new Date();

      if (
        order.paymentMethod ===
        "COD"
      ) {
        updateData.paymentStatus =
          "Paid";
      }
    }

    if (
      status === "Cancelled"
    ) {
      updateData.cancelledAt =
        new Date();
    }

    return await orderRepository.updateOrder(
      orderId,
      updateData,
    );
  };

/*                        Update Payment Status                               */

const updatePaymentStatus =
  async (
    orderId,
    paymentStatus,
  ) => {
    const order =
      await orderRepository.getOrderById(
        orderId,
      );

    if (!order) {
      throw new ApiError(
        404,
        "Order not found",
      );
    }

    return await orderRepository.updateOrder(
      orderId,
      {
        paymentStatus,
      },
    );
  };

/*                             Return Order                                   */

const returnOrder =
  async (
    orderId,
    reason,
  ) => {
    const order =
      await orderRepository.getOrderById(
        orderId,
      );

    if (!order) {
      throw new ApiError(
        404,
        "Order not found",
      );
    }

    if (
      order.orderStatus !==
      "Delivered"
    ) {
      throw new ApiError(
        400,
        "Only delivered orders can be returned",
      );
    }

    return await orderRepository.updateOrder(
      orderId,
      {
        returnStatus:
          "Requested",
        returnReason:
          reason,
        returnRequestedAt:
          new Date(),
      },
    );
  };

/*                                  Export                                    */

export default {
  createOrder,

  getMyOrders,

  getOrderById,

  getAllOrders,

  cancelOrder,

  updateOrderStatus,

  updatePaymentStatus,

  returnOrder,
};