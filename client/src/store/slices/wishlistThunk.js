import wishlistService from "../../services/wishlist.service";

import {
  fetchWishlistStart,
  fetchWishlistSuccess,
  fetchWishlistFailure,
  addToWishlistStart,
  addToWishlistSuccess,
  addToWishlistFailure,
  removeFromWishlistStart,
  removeFromWishlistSuccess,
  removeFromWishlistFailure,
  clearWishlistStart,
  clearWishlistSuccess,
  clearWishlistFailure,
} from "./wishlistSlice";

// =========================
// Get Wishlist
// =========================

export const fetchWishlist = () => async (dispatch) => {
  try {
    dispatch(fetchWishlistStart());

    const response = await wishlistService.getWishlist();

    dispatch(
      fetchWishlistSuccess(
        response?.data || {
          products: [],
        },
      ),
    );
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch wishlist";

    dispatch(fetchWishlistFailure(message));
  }
};

// =========================
// Add Product To Wishlist
// =========================

export const addWishlistProduct = (productId) => async (dispatch) => {
  try {
    dispatch(addToWishlistStart());

    const response = await wishlistService.addToWishlist(productId);

    const products = response?.data?.products || [];

    const addedProduct = products.find(
      (product) => (product?._id || product?.id) === productId,
    );

    dispatch(addToWishlistSuccess(addedProduct || null));
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to add product to wishlist";

    dispatch(addToWishlistFailure(message));
  }
};

// =========================
// Remove Product From Wishlist
// =========================

export const removeWishlistProduct = (productId) => async (dispatch) => {
  try {
    dispatch(removeFromWishlistStart());

    await wishlistService.removeFromWishlist(productId);

    dispatch(removeFromWishlistSuccess(productId));
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to remove product from wishlist";

    dispatch(removeFromWishlistFailure(message));
  }
};

// =========================
// Clear Wishlist
// =========================

export const clearWishlistProducts = () => async (dispatch) => {
  try {
    dispatch(clearWishlistStart());

    await wishlistService.clearWishlist();

    dispatch(clearWishlistSuccess());
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to clear wishlist";

    dispatch(clearWishlistFailure(message));
  }
};
