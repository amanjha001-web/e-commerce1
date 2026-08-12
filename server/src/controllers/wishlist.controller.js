import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import wishlistService from "../services/wishlist.service.js";

/*                          Add To Wishlist                                   */

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const wishlist = await wishlistService.addToWishlist(req.user._id, productId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, wishlist, "Product added to wishlist successfully"),
    );
});

/*                           Get Wishlist                                     */

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Wishlist fetched successfully"));
});

/*                      Remove From Wishlist                                  */

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await wishlistService.removeFromWishlist(
    req.user._id,
    productId,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        wishlist,
        "Product removed from wishlist successfully",
      ),
    );
});

/*                          Clear Wishlist                                    */

export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.clearWishlist(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Wishlist cleared successfully"));
});
