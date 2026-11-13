import { cartService } from '../../services/customer/cart.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  return ApiResponse.success(res, cart, 'Cart retrieved');
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, variant } = req.body;
  const cart = await cartService.addToCart(req.user._id, { productId, quantity, variant });
  return ApiResponse.success(res, cart, 'Item added to cart');
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, variant } = req.body;
  const cart = await cartService.updateCartItem(req.user._id, productId, { quantity, variant });
  return ApiResponse.success(res, cart, 'Cart item updated');
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const variant = req.body?.variant || req.query?.variant;
  const cart = await cartService.removeCartItem(req.user._id, productId, variant);
  return ApiResponse.success(res, cart, 'Cart item removed');
});

export const clearCart = asyncHandler(async (req, res) => {
  const result = await cartService.clearCart(req.user._id);
  return ApiResponse.success(res, result, result.message);
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const cart = await cartService.applyCoupon(req.user._id, couponCode);
  return ApiResponse.success(res, cart, 'Coupon applied successfully');
});

export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCoupon(req.user._id);
  return ApiResponse.success(res, cart, 'Coupon removed');
});

export const validateCart = asyncHandler(async (req, res) => {
  const result = await cartService.validateCart(req.user._id);
  return ApiResponse.success(res, result, 'Cart validated');
});
