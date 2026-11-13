import { Cart } from '../../models/Cart.model.js';
import { Product } from '../../models/Product.model.js';
import { ProductVariant } from '../../models/ProductVariant.model.js';
import { Coupon } from '../../models/Coupon.model.js';
import { ApiError } from '../../utils/apiError.js';
import { roundToTwoDecimals } from '../../utils/helpers.js';
import { couponCommonService } from '../common/coupon.service.js';

export class CartService {
  async recalculateCart(cart) {
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        // Enforce server-side authoritative price
        item.price = product.price;
        subtotal += item.price * item.quantity;
      }
    }

    cart.totalAmount = roundToTwoDecimals(subtotal);

    // Re-verify coupon if present
    if (cart.coupon && cart.coupon.code) {
      try {
        const val = await couponCommonService.validateCoupon(
          cart.coupon.code,
          cart.totalAmount,
          cart.userId
        );
        cart.discountAmount = val.coupon.discountCalculated;
        cart.coupon.discount = cart.discountAmount;
      } catch {
        // If coupon no longer valid, clear it
        cart.coupon = undefined;
        cart.discountAmount = 0;
      }
    } else {
      cart.discountAmount = 0;
    }

    cart.finalAmount = roundToTwoDecimals(Math.max(0, cart.totalAmount - cart.discountAmount));
    await cart.save();
    return cart;
  }

  async getCart(userId) {
    let cart = await Cart.findOne({ userId })
      .populate('items.product', 'name slug images price stock isActive status vendorId')
      .populate('items.variant', 'title price stock sku attributes');

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    return cart;
  }

  async addToCart(userId, { productId, quantity = 1, variant = null }) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw ApiError.notFound('Product not found or currently unavailable');
    }

    let availableStock = product.stock;
    let price = product.price;

    if (variant) {
      const v = await ProductVariant.findById(variant);
      if (v) {
        availableStock = v.stock;
        price = v.price;
      }
    }

    if (availableStock < quantity) {
      throw ApiError.badRequest(`Insufficient stock. Only ${availableStock} items available.`);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (variant ? item.variant?.toString() === variant.toString() : !item.variant)
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > availableStock) {
        throw ApiError.badRequest(`Cannot add more. Total in cart would exceed available stock (${availableStock}).`);
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = price;
    } else {
      cart.items.push({
        product: productId,
        variant: variant || null,
        quantity,
        price,
      });
    }

    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  async updateCartItem(userId, productId, { quantity, variant = null }) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw ApiError.notFound('Cart not found');

    const item = cart.items.find(
      (i) =>
        i.product.toString() === productId &&
        (variant ? i.variant?.toString() === variant.toString() : true)
    );

    if (!item) throw ApiError.notFound('Item not in cart');

    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      throw ApiError.badRequest(`Only ${product.stock} items in stock.`);
    }

    item.quantity = quantity;
    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  async removeCartItem(userId, productId, variant = null) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw ApiError.notFound('Cart not found');

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          (variant ? item.variant?.toString() === variant.toString() : true)
        )
    );

    await this.recalculateCart(cart);
    return this.getCart(userId);
  }

  async clearCart(userId) {
    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      cart.coupon = undefined;
      cart.totalAmount = 0;
      cart.discountAmount = 0;
      cart.finalAmount = 0;
      await cart.save();
    }
    return { message: 'Cart cleared successfully' };
  }

  async applyCoupon(userId, couponCode) {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    const val = await couponCommonService.validateCoupon(
      couponCode,
      cart.totalAmount,
      userId
    );

    cart.coupon = {
      code: val.coupon.code,
      discount: val.coupon.discountCalculated,
      discountType: val.coupon.discountType,
    };
    cart.discountAmount = val.coupon.discountCalculated;
    cart.finalAmount = roundToTwoDecimals(Math.max(0, cart.totalAmount - cart.discountAmount));

    await cart.save();
    return this.getCart(userId);
  }

  async removeCoupon(userId) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw ApiError.notFound('Cart not found');

    cart.coupon = undefined;
    cart.discountAmount = 0;
    cart.finalAmount = cart.totalAmount;
    await cart.save();

    return this.getCart(userId);
  }

  async validateCart(userId) {
    const cart = await this.getCart(userId);
    const issues = [];

    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        issues.push(`Product '${item.product?.name || 'Unknown'}' is no longer available`);
      } else if (item.product.stock < item.quantity) {
        issues.push(
          `Product '${item.product.name}' only has ${item.product.stock} items remaining in stock`
        );
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      cart,
    };
  }
}

export const cartService = new CartService();
export default cartService;
