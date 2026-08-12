import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import cartService from "../services/cart.service.js";

/*                              Add To Cart                                   */

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const cart = await cartService.addToCart(req.user._id, productId, quantity);

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Product added to cart successfully"));
});

/*                              Get My Cart                                   */

export const getMyCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getMyCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart fetched successfully"));
});

/*                           Update Cart Item                                 */

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const cart = await cartService.updateCartItem(
    req.user._id,
    productId,
    quantity,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart updated successfully"));
});

/*                           Remove Cart Item                                 */

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await cartService.removeCartItem(req.user._id, productId);

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Product removed from cart successfully"));
});

/*                               Clear Cart                                   */

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart cleared successfully"));
});

