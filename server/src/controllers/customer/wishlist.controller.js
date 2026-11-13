import { wishlistService } from '../../services/customer/wishlist.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user._id);
  return ApiResponse.success(res, wishlist, 'Wishlist retrieved');
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await wishlistService.addToWishlist(req.user._id, productId);
  return ApiResponse.success(res, wishlist, 'Product added to wishlist');
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const wishlist = await wishlistService.removeFromWishlist(req.user._id, productId);
  return ApiResponse.success(res, wishlist, 'Product removed from wishlist');
});

export const clearWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.clearWishlist(req.user._id);
  return ApiResponse.success(res, result, result.message);
});
